import { useState } from "react";
import { useLineCore } from "./line-core";
import { setNoneFlag } from "./lines-api";
import type { PageVisit } from "./page-api";
import { useDiagnoses } from "./useDiagnoses";
import { useProcedures } from "./useProcedures";

type Args = {
  visit: PageVisit;
  readOnly: boolean;
  /** The tooth chosen in the chart: it pre-fills a new line. */
  toothHint: number | null;
  /** The visit version is shared with the notes autosave; every write reads and sets it here. */
  visitVersion: { get: () => number; set: (version: number) => void };
};

/**
 * Diagnosis and procedure lines of one draft visit. Every change shows at once; the server answers
 * after; when it refuses the screen goes back and one plain sentence says why.
 */
export function useVisitLines({ visit, readOnly, toothHint, visitVersion }: Args) {
  const core = useLineCore();
  const [none, setNone] = useState({ dx: visit.noDiagnosis, proc: visit.noProcedure });
  const dx = useDiagnoses({
    core,
    visit,
    readOnly,
    toothHint,
    onAdded: () => setNone((n) => ({ ...n, dx: false })),
  });
  const pr = useProcedures({
    core,
    visit,
    readOnly,
    toothHint,
    onAdded: () => setNone((n) => ({ ...n, proc: false })),
  });

  /** "No diagnosis / No procedure for this visit": refused while there are lines (one sentence). */
  function toggleNone(which: "dx" | "proc") {
    if (readOnly) return;
    const on = !none[which];
    const count = which === "dx" ? dx.count() : pr.count();
    if (on && count > 0) {
      core.setError(
        which === "dx"
          ? "This visit has a diagnosis. Remove it first, then choose No diagnosis."
          : "This visit has a procedure. Remove it first, then choose No procedure.",
      );
      return;
    }
    setNone((n) => ({ ...n, [which]: on }));
    void core.send(
      `none-${which}`,
      async () => {
        const r = await setNoneFlag(visit.id, {
          version: visitVersion.get(),
          ...(which === "dx" ? { noDiagnosis: on } : { noProcedure: on }),
        });
        visitVersion.set(r.visit.version);
      },
      () => setNone((n) => ({ ...n, [which]: !on })),
      "Could not save that choice. It is back as it was.",
    );
  }

  return {
    diagnoses: dx.lines,
    procedures: pr.lines,
    noDiagnosis: none.dx,
    noProcedure: none.proc,
    saveState: core.saveState,
    savedAt: core.savedAt,
    error: core.error,
    clearError: core.clearError,
    undo: core.undo,
    runUndo: core.runUndo,
    diagnosis: {
      add: dx.add,
      remove: dx.remove,
      setTooth: dx.setTooth,
      toggleNone: () => toggleNone("dx"),
    },
    procedure: {
      add: pr.add,
      addInline: pr.addInline,
      remove: pr.remove,
      setTooth: pr.setTooth,
      toggleSurface: pr.toggleSurface,
      setNote: pr.setNote,
      setMoreSittings: pr.setMoreSittings,
      toggleNone: () => toggleNone("proc"),
    },
  };
}

export type VisitLines = ReturnType<typeof useVisitLines>;
