import { useState } from "react";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { finaliseVisit, getVisit, type VisitSummary } from "./api";
import { finaliseWarnings } from "./finalise-warnings";

type Props = {
  visit: VisitSummary;
  canEdit: boolean;
  onFinalised: (visit: VisitSummary) => void;
};

/** 3.5.6: soft warnings then lock the draft (S05). */
export function VisitFinaliseBar({ visit, canEdit, onFinalised }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit || visit.status !== "draft") return null;

  const warnings = finaliseWarnings(visit);

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
          warnings.length > 0
            ? `After finalise, notes become read-only. Warnings: ${warnings.join(" ")}`
            : "After finalise, notes become read-only. You can still add an addendum."
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
