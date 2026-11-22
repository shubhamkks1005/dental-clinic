import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { getHistorySummary, type HistorySummary } from "./api";
import { HistoryFilterChips } from "./HistoryFilterChips";
import { HistorySummaryStrip } from "./HistorySummaryStrip";
import "./history.css";

type Props = { patientId: string };

/** 3.5.11: History tab shell + summary; feed loads in 3.5.12 (S04/S17). */
export function PatientHistoryTab({ patientId }: Props) {
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getHistorySummary(patientId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSummary(null);
          setError(
            e instanceof ApiError
              ? e.message
              : "Could not load history. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!summary) return <p className="muted">Loading…</p>;

  const empty = summary.totalVisits === 0 && !summary.nextAppointment;

  return (
    <div className="patient-history">
      <HistorySummaryStrip summary={summary} patientId={patientId} />
      <HistoryFilterChips />
      {empty ? (
        <div className="history-empty" role="status">
          <p>No history yet for this patient.</p>
          <Link
            className="btn btn-primary"
            to={`/app/appointments?patient=${encodeURIComponent(patientId)}`}
          >
            Add first appointment
          </Link>
        </div>
      ) : (
        <p className="muted history-feed-placeholder">
          Visit and appointment history will appear here.
        </p>
      )}
    </div>
  );
}
