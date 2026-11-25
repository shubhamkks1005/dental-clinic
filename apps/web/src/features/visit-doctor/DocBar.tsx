import { useState } from "react";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { RxStatus } from "../prescriptions";
import { SaveStatusChip } from "../visits/SaveStatusChip";
import type { SaveStatus } from "../visits/visit-autosave";
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
  onOpenRx: () => void;
  onFinalised: () => void;
};

/** Bottom bar: what is saved, what is done, and Finalise. The warnings never block (3.5.6). */
export function DocBar({
  visit,
  lines,
  notesStatus,
  rxStatus,
  version,
  onOpenRx,
  onFinalised,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <SaveStatusChip status={notesStatus} />
        <span className={`vd-pill ${done.diagnosis ? "vd-pill-success" : "vd-pill-warning"}`}>
          {done.diagnosis ? "Diagnosis done ✓" : "Diagnosis missing"}
        </span>
        <span className={`vd-pill ${done.procedure ? "vd-pill-success" : "vd-pill-warning"}`}>
          {done.procedure ? "Procedures done ✓" : "Procedures missing"}
        </span>
        {rxDraft && !finalised && (
          <button type="button" className="vd-chip vd-chip-warning" onClick={onOpenRx}>
            Prescription is a draft · Open it
          </button>
        )}
      </div>
      <div className="vd-bar-right">
        {error && (
          <span role="alert" className="vd-error">
            {error}
          </span>
        )}
        <span className="vd-bar-note">Finalise creates bill and updates plan</span>
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
