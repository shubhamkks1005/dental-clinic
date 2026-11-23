import { hasActiveConsent } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatientConsents } from "../patients/api";
import { listVisitPrescriptions } from "../prescriptions/api";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { finaliseVisit, getVisit, type VisitSummary } from "./api";
import { finaliseWarnings } from "./finalise-warnings";

type Props = {
  visit: VisitSummary;
  canEdit: boolean;
  onFinalised: (visit: VisitSummary) => void;
};

/** 3.5.6 / 3.8.2: soft warnings then lock the draft (S05). */
export function VisitFinaliseBar({ visit, canEdit, onFinalised }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTreatmentConsent, setHasTreatmentConsent] = useState<boolean | undefined>(undefined);
  const [hasDraftPrescription, setHasDraftPrescription] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listVisitPrescriptions(visit.id)
      .then((rows) => {
        if (!cancelled) setHasDraftPrescription(rows.some((r) => r.status === "draft"));
      })
      .catch(() => {
        /* warning only: nothing to show if the list cannot load */
      });
    return () => {
      cancelled = true;
    };
  }, [visit.id, open]);

  useEffect(() => {
    let cancelled = false;
    getPatientConsents(visit.patientId)
      .then((rows) => {
        if (!cancelled) setHasTreatmentConsent(hasActiveConsent(rows, "treatment"));
      })
      .catch(() => {
        if (!cancelled) setHasTreatmentConsent(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [visit.patientId]);

  if (!canEdit || visit.status !== "draft") return null;

  const warnings = finaliseWarnings(visit, { hasTreatmentConsent, hasDraftPrescription });

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await finaliseVisit(visit.id, visit.version);
      const fresh = await getVisit(visit.id);
      onFinalised(fresh);
      setOpen(false);
    } catch (err: unknown) {
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
    <div className="visit-finalise">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Finalise visit
      </button>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
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
