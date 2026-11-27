import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { RxStatus } from "../prescriptions";
import { saveStatusLabel, type SaveStatus } from "../visits/visit-autosave";
import { finaliseVisit } from "../visits/api";
import { useTreatmentConsent } from "../visits/useTreatmentConsent";
import { finaliseWarnings } from "../visits/finalise-warnings";
import type { VisitLines } from "./useVisitLines";
import { doneStates } from "./lines-model";
import type { PageVisit } from "./page-api";

type Props = {
  visit: PageVisit;
  lines: VisitLines;
  notesStatus: SaveStatus;
  rxStatus: RxStatus;
  /** Latest version (notes and none choices share it). */
  version: () => number;
  onFinalised: () => void;
};

/** Bottom bar: what is saved, what is done, and Finalise. The warnings never block (3.5.6). */
export function DocBar({ visit, lines, notesStatus, rxStatus, version, onFinalised }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState("");
  useEffect(() => {
    if (notesStatus === "saved") {
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }));
    }
  }, [notesStatus]);
  const hasTreatmentConsent = useTreatmentConsent(visit.patientId);
  const done = doneStates({
    diagnoses: lines.diagnoses.length,
    procedures: lines.procedures.length,
    noDiagnosis: lines.noDiagnosis,
    noProcedure: lines.noProcedure,
  });
  const finalised = visit.status !== "draft";
  const rxDraft = rxStatus === "draft";

  const warnings = finaliseWarnings(
    {
      diagnoses: lines.diagnoses,
      procedures: lines.procedures,
      noDiagnosis: lines.noDiagnosis,
      noProcedure: lines.noProcedure,
    },
    { hasTreatmentConsent, hasDraftPrescription: rxDraft },
  );

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await finaliseVisit(visit.id, version());
      setOpen(false);
      onFinalised();
    } catch (err: unknown) {
      setOpen(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not finalise. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vd-bar" role="region" aria-label="Finish the visit">
      <div className="vd-bar-left">
        <span
          className={`vd-save ${notesStatus === "saved" ? "is-saved" : "is-error"}`}
          role="status"
          aria-live="polite"
        >
          <span className="vd-icon" aria-hidden="true">
            cloud_done
          </span>
          {notesStatus === "saved" && savedAt
            ? `Saved ${savedAt.toUpperCase()}`
            : saveStatusLabel(notesStatus)}
        </span>
        <span className={`vd-bar-pill ${done.diagnosis ? "vd-pill-success" : "vd-pill-warning"}`}>
          {done.diagnosis ? "Diagnosis done ✓" : "Diagnosis missing"}
        </span>
        <span className={`vd-bar-pill ${done.procedure ? "vd-pill-success" : "vd-pill-warning"}`}>
          {done.procedure ? "Procedures done ✓" : "Procedures missing"}
        </span>
      </div>
      <div className="vd-bar-right">
        {error && (
          <span role="alert" className="vd-error">
            {error}
          </span>
        )}
        <span className="vd-bar-note">Finalise opens the invoice &amp; updates plan</span>
        <button
          type="button"
          className="vd-finalise"
          disabled={busy || finalised}
          onClick={() => setOpen(true)}
        >
          {finalised ? "Finalised" : "Finalise visit"}
        </button>
      </div>
      <ConfirmDialog
        open={open}
        title="Finalise this visit?"
        message={
          "After finalise, notes become read-only. An addendum can add a note but not a procedure. " +
          (warnings.length > 0 ? `Warnings: ${warnings.join(" ")}` : "")
        }
        confirmLabel="Finalise"
        cancelLabel="Keep editing"
        busy={busy}
        onConfirm={() => void confirm()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
