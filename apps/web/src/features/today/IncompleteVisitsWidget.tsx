import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { listDraftVisits, type VisitDraftReminder } from "../visits/api";
import { incompleteVisitsLabel } from "./incomplete-visits-label";

/** 3.5.8: remind doctor of draft visits still open (incl. yesterday’s). Never auto-finalises. S01. */
export function IncompleteVisitsWidget() {
  const [visits, setVisits] = useState<VisitDraftReminder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDraftVisits()
      .then((rows) => {
        setVisits(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        setVisits(null);
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load unfinished visits. Check the connection, then try again.",
        );
      });
  }, []);

  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!visits || visits.length === 0) return null;

  return (
    <section className="card incomplete-visits" aria-labelledby="incomplete-visits-title">
      <h2 id="incomplete-visits-title">{incompleteVisitsLabel(visits.length)}</h2>
      <p className="small muted">
        Open each visit and finalise when ready. Nothing is auto-finalised.
      </p>
      <ul className="incomplete-visits-list">
        {visits.map((v) => (
          <li key={v.id}>
            <Link className="incomplete-visits-link" to={`/app/visits/${v.id}`}>
              <span className="incomplete-visits-date">{v.visitDateLocal}</span>
              <span className="incomplete-visits-name">
                {v.patientName} · {v.patientCode}
              </span>
              {v.chiefComplaint ? (
                <span className="small muted incomplete-visits-complaint">{v.chiefComplaint}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
