import {
  displayAge,
  displayMobile,
  firstPage,
  istDate,
  type Page,
  type PageQuery,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { DataTable, type Column, type TableStatus } from "../../ui/table";
import { listPatients, type PatientListFilter, type PatientListRow } from "./api";
import "./patients.css";

const GENDER_LABEL = { female: "Female", male: "Male", other: "Other" } as const;

type ListView = "all_active" | "new_month" | "inactive_6m" | "archived";

function ageLabel(r: PatientListRow, today: string): string {
  const age = displayAge(
    {
      dateOfBirth: r.dateOfBirth,
      ageYearsAtReg: r.ageYearsAtReg,
      registeredOn: istDate(new Date(r.createdAt)),
    },
    today,
  );
  return age ? `${age}, ` : "";
}

const COLUMNS: Column<PatientListRow>[] = [
  {
    key: "full_name",
    label: "Name",
    sortable: true,
    render: (r) => (
      <span className="patients-name">
        <Link className="patients-name-main" to={`/app/patients/${r.id}`}>
          {r.fullName}
        </Link>
        <span className="muted patients-name-meta">
          {ageLabel(r, istDate(new Date()))}
          {GENDER_LABEL[r.gender]}
        </span>
      </span>
    ),
  },
  {
    key: "code",
    label: "Patient no.",
    sortable: true,
    render: (r) => <PatientNoChip patientNo={r.code} />,
  },
  {
    key: "mobile",
    label: "Mobile",
    sortable: false,
    render: (r) => (r.mobile ? displayMobile(r.mobile) : "—"),
  },
];

function viewOptions(view: ListView): {
  status: "active" | "archived" | "all";
  filter: PatientListFilter | null;
} {
  if (view === "archived") return { status: "archived", filter: null };
  if (view === "new_month") return { status: "active", filter: "new_month" };
  if (view === "inactive_6m") return { status: "active", filter: "inactive_6m" };
  return { status: "active", filter: null };
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
  return (
    <div className="patients">
      <header className="patients-head">
        <h1>Patients</h1>
        <p className="muted">
          {total == null
            ? "Loading…"
            : `${total.toLocaleString("en-IN")} patients. Use the arrow keys and Enter to open one without a mouse.`}
        </p>
      </header>
      <div className="patients-filters" role="toolbar" aria-label="Patient filters">
        {(
          [
            ["all_active", "All active"],
            ["new_month", "New this month"],
            ["inactive_6m", "Not seen in 6 months"],
            ["archived", "Archived"],
          ] as const
        ).map(([id, label]) => (
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
        columns={COLUMNS}
        page={page}
        query={query}
        onQuery={setQuery}
        rowKey={(r) => r.id}
        status={status}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    </div>
  );
}
