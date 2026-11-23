import { istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { createBillFromVisit } from "../billing";
import { listDayAppointments } from "../appointments/api";
import type { VisitSummary } from "./api";
import { openOrReuseVisit } from "./open-visit";

/** After the visit is finalised: make the bill, or go back to Today for the next patient. */
export function VisitNextSteps({ visit, canBill }: { visit: VisitSummary; canBill: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<{
    patientId: string;
    appointmentId: string;
    name: string;
  } | null>(null);
  const final = visit.status === "final";

  useEffect(() => {
    if (!final) return;
    let cancelled = false;
    listDayAppointments(istDate(new Date()))
      .then((day) => {
        const next = day.appointments
          .filter((a) => a.status === "arrived" && a.patientId !== visit.patientId)
          .sort((a, b) => a.startMin - b.startMin)[0];
        if (!cancelled && next) {
          setWaiting({ patientId: next.patientId, appointmentId: next.id, name: next.patientName });
        }
      })
      .catch(() => {
        /* the plain "Back to Today" link still works */
      });
    return () => {
      cancelled = true;
    };
  }, [final, visit.patientId]);

  function openWaiting() {
    if (!waiting) return;
    setBusy(true);
    openOrReuseVisit({ patientId: waiting.patientId, appointmentId: waiting.appointmentId })
      .then((id) => navigate(`/app/visits/${id}`))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not open the next visit. Check the connection, then try again.",
        );
        setBusy(false);
      });
  }

  if (visit.status !== "final") return null;
  const noProcedures = visit.procedures.length === 0;

  function makeBill(reviewFirst: boolean) {
    setBusy(true);
    setError(null);
    createBillFromVisit(visit.id, { reviewFirst })
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
    <div className="visit-next v1-final-banner">
      <p className="v1-final-title">
        <strong>Final.</strong> {noProcedures ? "Nothing to bill." : "Ready to bill."}
      </p>
      <div className="row wrap gap-sm">
        {canBill ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || noProcedures}
            onClick={() => makeBill(false)}
          >
            {busy ? "Creating bill…" : "Create bill"}
          </button>
        ) : null}
        {canBill ? (
          <button
            type="button"
            className="btn"
            disabled={busy || noProcedures}
            onClick={() => makeBill(true)}
          >
            Review first
          </button>
        ) : null}
        {waiting ? (
          <button type="button" className="btn" disabled={busy} onClick={openWaiting}>
            Open next waiting patient: {waiting.name}
          </button>
        ) : (
          <Link className="btn" to="/app">
            Back to Today
          </Link>
        )}
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
