import { firstPage, type Page, type PageQuery } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { DataTable, type TableStatus } from "../../ui/table";
import { listPatients, type PatientListFilter, type PatientListRow } from "./api";
import { PATIENT_COLUMNS, PatientCard } from "./patient-list-columns";
import "./patients.css";

type ListView = "all_active" | "new_month" | "balance_due" | "inactive_6m" | "archived";

const VIEWS: Array<[ListView, string]> = [
  ["all_active", "All"],
  ["new_month", "New this month"],
  ["balance_due", "Balance due"],
  ["inactive_6m", "Not seen in 6 months"],
  ["archived", "Archived"],
];

function viewOptions(view: ListView): {
  status: "active" | "archived" | "all";
  filter: PatientListFilter | null;
} {
  if (view === "archived") return { status: "archived", filter: null };
  if (view === "all_active") return { status: "active", filter: null };
  return { status: "active", filter: view };
}

// S02 (laptop) / S15 (phone): patient list with 2.2.5 filters; default sort recently registered.
export function PatientsScreen() {
  const [query, setQuery] = useState<PageQuery>({ ...firstPage("created_at"), dir: "desc" });
  const [view, setView] = useState<ListView>("all_active");
  const [page, setPage] = useState<Page<PatientListRow> | null>(null);
  const [status, setStatus] = useState<TableStatus>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus({ state: "loading" });
    listPatients(query, viewOptions(view))
      .then((next) => {
        if (cancelled) return;
        setPage(next);
        setStatus({ state: "ready" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus({
          state: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Could not load patients. Check the connection, then try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [query, view, attempt]);

  const total = page?.total;
  const typed = query.q.trim();
  return (
    <div className="patients">
      <header className="patients-head">
        <h1>Patients</h1>
        <p className="muted">
          {total == null ? "Loading…" : `${total.toLocaleString("en-IN")} patients`}
          <span className="patients-keys">
            . Use the arrow keys and Enter to open one without a mouse.
          </span>
        </p>
      </header>
      <div className="patients-filters" role="toolbar" aria-label="Patient filters">
        {VIEWS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn patients-filter${view === id ? " is-active" : ""}`}
            aria-pressed={view === id}
            onClick={() => {
              setView(id);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <DataTable
        caption="Patients"
        filterLabel="Search by name, mobile or patient code"
        emptyText="No patient matches this search."
        columns={PATIENT_COLUMNS}
        page={page}
        query={query}
        onQuery={setQuery}
        rowKey={(r) => r.id}
        status={status}
        onRetry={() => setAttempt((n) => n + 1)}
        renderCard={(row) => <PatientCard row={row} />}
      />
      {typed ? (
        <Link
          className="patients-add-new"
          to={`/app/patients/new?name=${encodeURIComponent(typed)}`}
        >
          + New patient: {typed}
        </Link>
      ) : null}
    </div>
  );
}
