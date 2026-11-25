import type { SearchOption } from "./lines-model";
import { doneStates } from "./lines-model";
import { DiagnosisSection } from "./DiagnosisSection";
import { UndoBar } from "./LineBits";
import { ProcedureSection } from "./ProcedureSection";
import type { PagePlanItem } from "./page-api";
import type { VisitLines } from "./useVisitLines";

type Props = {
  lines: VisitLines;
  diagnosisOptions: SearchOption[];
  procedureOptions: SearchOption[];
  plan: PagePlanItem[];
  readOnly: boolean;
  finalised: boolean;
};

const SAVE_WORD = { saved: "Saved", saving: "Saving…", error: "Not saved" } as const;

/** Body of Accordion 2: status row, locked banner, Undo, then diagnoses and procedures. */
export function DiagProcPanel({
  lines,
  diagnosisOptions,
  procedureOptions,
  plan,
  readOnly,
  finalised,
}: Props) {
  const done = doneStates({
    diagnoses: lines.diagnoses.length,
    procedures: lines.procedures.length,
    noDiagnosis: lines.noDiagnosis,
    noProcedure: lines.noProcedure,
  });
  const saved = lines.savedAt
    ? ` ${lines.savedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
    : "";

  return (
    <>
      <div className="vd-status-row">
        <div className="vd-status-left">
          <span className={`vd-pill ${finalised ? "vd-pill-info" : "vd-pill-warning"}`}>
            {finalised ? "Finalised" : "Draft"}
          </span>
          <span
            className={`vd-save is-${lines.saveState}`}
            role="status"
            data-testid="lines-save-state"
          >
            {SAVE_WORD[lines.saveState]}
            {lines.saveState === "saved" ? saved : ""}
          </span>
        </div>
        <span className="vd-hint">
          Procedures go to the bill &amp; update the plan on Finalise.
        </span>
      </div>

      {finalised && (
        <div className="vd-locked">
          <strong>Finalised, read only.</strong> Add an addendum to correct.
        </div>
      )}
      {lines.error && (
        <p className="vd-error" role="alert">
          {lines.error}{" "}
          <button type="button" className="vd-small-btn" onClick={lines.clearError}>
            Dismiss
          </button>
        </p>
      )}
      <UndoBar undo={lines.undo} onUndo={lines.runUndo} />

      <DiagnosisSection
        lines={lines}
        options={diagnosisOptions}
        done={done.diagnosis}
        readOnly={readOnly}
      />
      <ProcedureSection
        lines={lines}
        options={procedureOptions}
        plan={plan}
        done={done.procedure}
        readOnly={readOnly}
      />
    </>
  );
}
