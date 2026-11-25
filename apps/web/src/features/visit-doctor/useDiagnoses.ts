import {
  addDiagnosis as apiAddDiagnosis,
  removeDiagnosis as apiRemoveDiagnosis,
  restoreDiagnosis as apiRestoreDiagnosis,
  updateDiagnosis as apiUpdateDiagnosis,
} from "./lines-api";
import { useListRef, type LineCore } from "./line-core";
import { diagFromPage, insertAt, tempKey, type DiagLine } from "./line-state";
import type { PageVisit } from "./page-api";

type Args = {
  core: LineCore;
  visit: PageVisit;
  readOnly: boolean;
  toothHint: number | null;
  /** A line was added: the "No diagnosis" choice is off now. */
  onAdded: () => void;
};

/** Diagnosis lines of the visit: add (list or free text), change tooth, remove with Undo. */
export function useDiagnoses({ core, visit, readOnly, toothHint, onAdded }: Args) {
  const { send, showUndo } = core;
  const [lines, setLines, ref] = useListRef(() => visit.diagnoses.map(diagFromPage));
  const visitId = visit.id;
  const byKey = (key: string) => ref.current.find((l) => l.key === key);
  const patch = (key: string, p: Partial<DiagLine>) =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...p } : l)));

  function remove(key: string, quiet = false) {
    const index = ref.current.findIndex((l) => l.key === key);
    const line = ref.current[index];
    if (!line || readOnly) return;
    setLines((all) => all.filter((l) => l.key !== key));
    if (!quiet) {
      showUndo(`Removed diagnosis: ${line.label}`, () => {
        setLines((all) => insertAt(all, byKey(key) ?? line, index));
        void send(
          key,
          async () => {
            const cur = byKey(key) ?? line;
            const r = await apiRestoreDiagnosis(visitId, cur.id as string, cur.version);
            patch(key, { version: r.diagnosis.version });
          },
          () => setLines((all) => all.filter((l) => l.key !== key)),
          "Could not bring that diagnosis back. Add it again.",
        );
      });
    }
    void send(
      key,
      async () => {
        const r = await apiRemoveDiagnosis(visitId, line.id as string, line.version);
        line.version = r.version;
        patch(key, { version: r.version });
      },
      () => setLines((all) => insertAt(all, line, index)),
      "Could not remove that diagnosis. It is back on the list.",
    );
  }

  function add(label: string, listItemId: string | null) {
    const text = label.trim();
    if (readOnly || !text) return;
    const key = tempKey();
    setLines((all) => [
      ...all,
      {
        key,
        id: null,
        version: 0,
        label: text,
        toothFdi: toothHint,
        fromList: listItemId !== null,
      },
    ]);
    onAdded();
    showUndo(`Added diagnosis: ${text}${toothHint ? ` (${toothHint})` : ""}`, () =>
      remove(key, true),
    );
    void send(
      key,
      async () => {
        const r = await apiAddDiagnosis(visitId, {
          listItemId,
          freeText: listItemId ? null : text,
          toothFdi: toothHint,
        });
        patch(key, { id: r.diagnosis.id, version: r.diagnosis.version });
      },
      () => setLines((all) => all.filter((l) => l.key !== key)),
      "Could not add that diagnosis. Try again.",
    );
  }

  function setTooth(key: string, fdi: number | null) {
    const before = byKey(key);
    if (!before || readOnly || before.toothFdi === fdi) return;
    patch(key, { toothFdi: fdi });
    void send(
      key,
      async () => {
        const cur = byKey(key) ?? before;
        const r = await apiUpdateDiagnosis(visitId, cur.id as string, {
          version: cur.version,
          toothFdi: fdi,
        });
        patch(key, { version: r.diagnosis.version });
      },
      () => patch(key, { toothFdi: before.toothFdi }),
      "Could not save the tooth number. It is back as it was.",
    );
  }

  return {
    lines,
    count: () => ref.current.length,
    add,
    remove: (key: string) => remove(key),
    setTooth,
  };
}
