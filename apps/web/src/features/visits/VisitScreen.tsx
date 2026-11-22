import { VISIT_STATUS_LABEL } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { StatusBadge } from "../../ui/StatusBadge";
import { getVisit, type VisitSummary } from "./api";
import "./visit.css";

/** 3.5.1 shell: open/idempotent draft lands here. Full layout is 3.5.2 (S05). */
export function VisitScreen() {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<VisitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getVisit(id)
      .then((row) => {
        if (!cancelled) setVisit(row);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this visit. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <p className="notice notice-error" role="alert">
        Visit not found. Go back to Today.
      </p>
    );
  }
  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!visit) return <p className="muted">Loading visit…</p>;

  return (
    <div className="visit-screen">
      <p className="visit-back">
        <Link to="/app">← Today</Link>
        {" · "}
        <Link to={`/app/patients/${visit.patientId}`}>Patient</Link>
        {" · "}
        <Link to={`/app/patients/${visit.patientId}?tab=chart`}>Chart</Link>
      </p>
      <header className="visit-head">
        <h1>Visit · {visit.visitDateLocal}</h1>
        <StatusBadge
          tone={visit.status === "draft" ? "upcoming" : "done"}
          label={VISIT_STATUS_LABEL[visit.status]}
        />
      </header>
      <p className="muted small">
        Draft opened. Full visit notes and layout come next (chart is on the patient Chart tab for
        now).
      </p>
    </div>
  );
}
