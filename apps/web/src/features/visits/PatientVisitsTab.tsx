import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { formatDate } from "../../ui/format";
import { StatusLabel } from "../../ui/StatusLabel";
import { listVisitTimeline, type VisitTimelineRow } from "./api";
import "./visit-timeline.css";

type Props = { patientId: string };

/** 3.5.9: visit timeline on patient profile Visits tab (S04/S17). */
export function PatientVisitsTab({ patientId }: Props) {
  const [diagnosis, setDiagnosis] = useState("");
  const [procedure, setProcedure] = useState("");
  const [applied, setApplied] = useState({ diagnosis: "", procedure: "" });
  const [rows, setRows] = useState<VisitTimelineRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listVisitTimeline(patientId, {
      limit: 50,
      diagnosis: applied.diagnosis || undefined,
      procedure: applied.procedure || undefined,
    })
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRows(null);
          setError(
            e instanceof ApiError
              ? e.message
              : "Could not load visits. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, applied]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    setApplied({ diagnosis: diagnosis.trim(), procedure: procedure.trim() });
  }

  function clearFilters() {
    setDiagnosis("");
    setProcedure("");
    setApplied({ diagnosis: "", procedure: "" });
  }

  return (
    <div className="visit-timeline">
      <form className="visit-timeline-filters" onSubmit={applyFilters}>
        <label>
          Diagnosis
          <input
            type="search"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. caries"
            autoComplete="off"
          />
        </label>
        <label>
          Procedure
          <input
            type="search"
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="e.g. filling"
            autoComplete="off"
          />
        </label>
        <div className="visit-timeline-filter-actions">
          <button type="submit" className="btn btn-primary btn-compact">
            Filter
          </button>
          <button type="button" className="btn btn-compact" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}

      {!rows && !error ? <p className="muted">Loading…</p> : null}

      {rows && rows.length === 0 ? (
        <p className="muted">No visits match. Open a visit from Today or start a new visit.</p>
      ) : null}

      {rows && rows.length > 0 ? (
        <ul className="visit-timeline-list">
          {rows.map((row) => (
            <li key={row.id}>
              <Link className="visit-timeline-row" to={`/app/visits/${row.id}`}>
                <span className="visit-timeline-date">{formatDate(row.visitDateLocal)}</span>
                <StatusLabel kind="visit" value={row.status} />
                <span className="visit-timeline-summary">
                  {row.chiefComplaint?.trim() || "No complaint noted"}
                </span>
                {row.diagnoses.length > 0 ? (
                  <span className="small muted">Dx: {row.diagnoses.join(", ")}</span>
                ) : null}
                {row.procedures.length > 0 ? (
                  <span className="small muted">Px: {row.procedures.join(", ")}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
