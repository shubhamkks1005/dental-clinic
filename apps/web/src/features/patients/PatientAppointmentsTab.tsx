import { formatClockTime, formatDisplayDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { getAppointmentChain, listPatientAppointments, type PatientAppointmentRow } from "./api";
import "./patient-appointments.css";

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function chainSummary(chain: PatientAppointmentRow[]): string {
  return chain
    .map(
      (r) =>
        `${formatDisplayDate(r.dateLocal)} ${formatClockTime(r.startMin)} (${statusLabel(r.status)})`,
    )
    .join(" → ");
}

// S04/S17 Appointments tab — list + reschedule chain (2.3.8). No hard deletes.
export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<PatientAppointmentRow[] | null>(null);
  const [chains, setChains] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPatientAppointments(patientId)
      .then(async (list) => {
        if (cancelled) return;
        setRows(list);
        setError(null);
        const tips = list.filter((r) => r.rescheduledFrom);
        const next: Record<string, string> = {};
        await Promise.all(
          tips.map(async (r) => {
            const chain = await getAppointmentChain(r.id);
            next[r.id] = chainSummary(chain);
          }),
        );
        if (!cancelled) setChains(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load appointments. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <section className="patient-appts" aria-labelledby="appts-title">
      <h2 id="appts-title">Appointments</h2>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {rows === null && !error && <p className="muted">Loading appointments…</p>}
      {rows && rows.length === 0 && <p className="muted">No appointments yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="patient-appts-list">
          {rows.map((r) => (
            <li key={r.id} className="patient-appts-card">
              <div className="patient-appts-row">
                <strong>
                  {formatDisplayDate(r.dateLocal)} · {formatClockTime(r.startMin)}
                </strong>
                <span className="patient-appts-status">{statusLabel(r.status)}</span>
              </div>
              <p className="muted">
                {r.visitTypeLabel}
                {r.priority === "emergency" ? " · Emergency" : ""}
              </p>
              {r.cancelReason && <p className="muted">Cancel: {r.cancelReason}</p>}
              {r.status === "rescheduled" && (
                <p className="muted">Moved to a later booking (kept for history).</p>
              )}
              {chains[r.id] && <p className="patient-appts-chain">Chain: {chains[r.id]}</p>}
            </li>
          ))}
        </ul>
      )}
      <Link
        className="btn btn-primary"
        to={`/app/appointments?patient=${encodeURIComponent(patientId)}`}
      >
        Book appointment
      </Link>
    </section>
  );
}
