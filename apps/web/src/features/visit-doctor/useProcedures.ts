import type { ToothSurface } from "@clinic/shared";
import { useEffect, useRef } from "react";
import {
  addProcedure as apiAddProcedure,
  addProcedureToList,
  removeProcedure as apiRemoveProcedure,
  restoreProcedure as apiRestoreProcedure,
  updateProcedure as apiUpdateProcedure,
} from "./lines-api";
import { sentence, useListRef, type LineCore } from "./line-core";
import { insertAt, procFromPage, tempKey, type ProcLine } from "./line-state";
import { toggleSurface } from "./lines-model";
import type { PageVisit } from "./page-api";

const NOTE_WAIT_MS = 500;

type Args = {
  core: LineCore;
  visit: PageVisit;
  readOnly: boolean;
  toothHint: number | null;
  /** A line was added: the "No procedure" choice is off now. */
  onAdded: () => void;
};

type Body = {
  toothFdi?: number | null;
  surfaces?: ToothSurface[];
  note?: string | null;
  moreSittings?: boolean;
};

/** Procedure lines of the visit: add from the list, tooth, surfaces, note, sittings, remove with Undo. */
export function useProcedures({ core, visit, readOnly, toothHint, onAdded }: Args) {
  const { send, showUndo, setError } = core;
  const [lines, setLines, ref] = useListRef(() => visit.procedures.map(procFromPage));
  const noteTimers = useRef(new Map<string, number>());
  // The note text the server has (or was loaded with): leaving a box that did not change sends nothing.
  const sentNote = useRef(new Map<string, string>());
  const visitId = visit.id;
  const byKey = (key: string) => ref.current.find((l) => l.key === key);
  const patch = (key: string, p: Partial<ProcLine>) =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...p } : l)));

  useEffect(() => {
    const timers = noteTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  function remove(key: string, quiet = false) {
    const index = ref.current.findIndex((l) => l.key === key);
    const line = ref.current[index];
    if (!line || readOnly) return;
    setLines((all) => all.filter((l) => l.key !== key));
    if (!quiet) {
      showUndo(`Removed procedure: ${line.label}`, () => {
        setLines((all) => insertAt(all, byKey(key) ?? line, index));
        void send(
          key,
          async () => {
            const cur = byKey(key) ?? line;
            const r = await apiRestoreProcedure(visitId, cur.id as string, cur.version);
            patch(key, { version: r.procedure.version });
          },
          () => setLines((all) => all.filter((l) => l.key !== key)),
          "Could not bring that procedure back. Add it again.",
        );
      });
    }
    void send(
      key,
      async () => {
        const r = await apiRemoveProcedure(visitId, line.id as string, line.version);
        line.version = r.version;
        patch(key, { version: r.version });
      },
      () => setLines((all) => insertAt(all, line, index)),
      "Could not remove that procedure. It is back on the list.",
    );
  }

  function add(listItemId: string, label: string, noFee: boolean) {
    if (readOnly) return;
    const key = tempKey();
    setLines((all) => [
      ...all,
      {
        key,
        id: null,
        version: 0,
        label,
        toothFdi: toothHint,
        surfaces: [],
        note: "",
        noFee,
        moreSittings: false,
      },
    ]);
    onAdded();
    showUndo(`Added procedure: ${label}${toothHint ? ` (${toothHint})` : ""}`, () =>
      remove(key, true),
    );
    void send(
      key,
      async () => {
        const r = await apiAddProcedure(visitId, { listItemId, toothFdi: toothHint });
        patch(key, { id: r.procedure.id, version: r.procedure.version });
      },
      () => setLines((all) => all.filter((l) => l.key !== key)),
      "Could not add that procedure. Try again.",
    );
  }

  /** One field of a line: shows at once, saved in order, put back if the server refuses. */
  function edit(key: string, local: Partial<ProcLine>, body: Body, fallback: string) {
    const before = byKey(key);
    if (!before || readOnly) return;
    patch(key, local);
    void send(
      key,
      async () => {
        const cur = byKey(key) ?? before;
        const r = await apiUpdateProcedure(visitId, cur.id as string, {
          version: cur.version,
          ...body,
        });
        patch(key, { version: r.procedure.version });
      },
      () => patch(key, before),
      fallback,
    );
  }

  const setTooth = (key: string, fdi: number | null) =>
    edit(
      key,
      { toothFdi: fdi },
      { toothFdi: fdi },
      "Could not save the tooth number. It is back as it was.",
    );

  function toggleSurfaceOf(key: string, s: ToothSurface) {
    const line = byKey(key);
    if (!line) return;
    const next = toggleSurface(line.surfaces, s);
    edit(
      key,
      { surfaces: next },
      { surfaces: next },
      "Could not save the surface. It is back as it was.",
    );
  }

  const setMoreSittings = (key: string, on: boolean) =>
    edit(
      key,
      { moreSittings: on },
      { moreSittings: on },
      "Could not save that change. It is back as it was.",
    );

  /** The note is saved a moment after the last key, or at once when the box is left. */
  function setNote(key: string, text: string, now = false) {
    const line = byKey(key);
    if (readOnly || !line) return;
    if (!sentNote.current.has(key)) sentNote.current.set(key, line.note);
    if (now && !noteTimers.current.has(key) && sentNote.current.get(key) === text) return;
    patch(key, { note: text });
    window.clearTimeout(noteTimers.current.get(key));
    const save = () => {
      noteTimers.current.delete(key);
      if (!byKey(key)) return;
      void send(
        key,
        async () => {
          const cur = byKey(key);
          if (!cur) return;
          const r = await apiUpdateProcedure(visitId, cur.id as string, {
            version: cur.version,
            note: cur.note.trim() === "" ? null : cur.note,
          });
          sentNote.current.set(key, cur.note);
          patch(key, { version: r.procedure.version });
        },
        () => undefined,
        "Could not save the note. Keep typing, then try again.",
      );
    };
    if (now) save();
    else noteTimers.current.set(key, window.setTimeout(save, NOTE_WAIT_MS));
  }

  /** Not in the list yet: name and fee go to the doctor's list first; if that fails no line is added. */
  async function addInline(label: string, paise: number): Promise<boolean> {
    if (readOnly) return false;
    try {
      const r = await addProcedureToList(label, paise);
      if (!r.item) throw new Error("no item");
      add(r.item.id, r.item.label, false);
      return true;
    } catch (err) {
      setError(sentence(err, "Could not add it to your list. No line was added."));
      return false;
    }
  }

  return {
    lines,
    count: () => ref.current.length,
    add,
    addInline,
    remove: (key: string) => remove(key),
    setTooth,
    toggleSurface: toggleSurfaceOf,
    setNote,
    setMoreSittings,
  };
}
