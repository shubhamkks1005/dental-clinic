import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { createBillFromVisit } from "../billing";
import type { VisitSummary } from "./api";

/** After the visit is finalised: make the bill, or go back to Today for the next patient. */
export function VisitNextSteps({ visit, canBill }: { visit: VisitSummary; canBill: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (visit.status !== "final") return null;
  const noProcedures = visit.procedures.length === 0;

  function makeBill() {
    setBusy(true);
    setError(null);
    createBillFromVisit(visit.id)
      .then((bill) => navigate(`/app/bills/${bill.id}`))
      .catch((err: unknown) => {
        // Stay on the visit: a failed bill must not hide the doctor's work.
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not create the bill. Check the connection, then try again.",
        );
        setBusy(false);
      });
  }

  return (
    <div className="visit-next">
      <div className="row wrap gap-sm">
        {canBill ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || noProcedures}
            onClick={makeBill}
          >
            {busy ? "Creating bill…" : "Create bill"}
          </button>
        ) : null}
        <Link className="btn" to="/app">
          Next patient
        </Link>
      </div>
      {canBill && noProcedures ? (
        <p className="muted small">
          No procedures were recorded on this visit, so there is nothing to bill. Ask the doctor to
          check the visit.
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
