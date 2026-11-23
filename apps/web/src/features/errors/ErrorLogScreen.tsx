import { istDateTime } from "@clinic/shared";
import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { PageMessage } from "../../ui/PageMessage";
import { getErrors, type ErrorLogRow } from "./api";
import "./errors.css";

// Doctor only, read only: app errors, newest first. Holds no patient data (scrubbed on save).
export function ErrorLogScreen() {
  const [rows, setRows] = useState<ErrorLogRow[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    getErrors()
      .then(setRows)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  if (problem) return <PageMessage title="Error log" text={problem} />;
  if (!rows) return <PageMessage title="Error log" text="Loading..." />;
  return (
    <div className="errlog">
      <h1>Error log</h1>
      <p className="muted">Newest first. Kept for 30 days. Send an Error ID to the developer.</p>
      {rows.length === 0 && <p>No errors recorded.</p>}
      <ul className="errlog-list">
        {rows.map((row) => (
          <li key={row.id} className="card errlog-item">
            <strong>{row.kind}</strong> <span className="muted">({row.source})</span>
            <p>{row.message}</p>
            <p className="muted">
              {istDateTime(new Date(row.createdAt))} · {row.path ?? "no path"} · {row.role ?? "?"} ·
              v{row.appVersion ?? "?"}
              {row.requestId ? ` · Error ID ${row.requestId}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
