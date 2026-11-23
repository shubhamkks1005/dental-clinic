import { useState } from "react";
import { ApiError } from "../../api/client";
import type { RxStatus } from "../prescriptions";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { finaliseVisit, getVisit, type VisitSummary } from "./api";
import { finaliseWarnings } from "./finalise-warnings";
import { SaveStatusChip } from "./SaveStatusChip";
import { useTreatmentConsent } from "./useTreatmentConsent";
import { visitChecklist } from "./visit-checklist";
import type { SaveStatus } from "./visit-autosave";

type Props = {
  visit: VisitSummary;
  saveStatus: SaveStatus;
  rxStatus: RxStatus;
  onFinalised: (visit: VisitSummary) => void;
};

/** Sticky bar of a draft visit: save state, checklist, Finalise. Rules stay in finalise-warnings.ts. */
export function VisitStickyBar({ visit, saveStatus, rxStatus, onFinalised }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTreatmentConsent = useTreatmentConsent(visit.patientId);

  const warnings = finaliseWarnings(visit, {
    hasTreatmentConsent,
    hasDraftPrescription: rxStatus === "draft",
  });

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await finaliseVisit(visit.id, visit.version);
      onFinalised(await getVisit(visit.id));
      setOpen(false);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not finalise. Check the connection, then try again.",
      );
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v1-bar" role="region" aria-label="Finish the visit">
      <SaveStatusChip status={saveStatus} />
      <ul className="v1-checks" aria-label="Before you finalise">
        {visitChecklist(visit, rxStatus).map((c) => (
          <li key={c.key} className={`v1-check is-${c.state}`}>
            <span aria-hidden="true">
              {c.state === "ok" ? "✓" : c.state === "warn" ? "!" : "–"}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
      {error && (
        <p className="notice notice-error v1-bar-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary v1-finalise"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Finalise visit
      </button>
      <ConfirmDialog
        open={open}
        title="Finalise this visit?"
        message={
          `After finalise, notes become read-only. An addendum can add a note but not a procedure. ` +
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
