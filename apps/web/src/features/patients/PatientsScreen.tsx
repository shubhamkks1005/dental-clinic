import { displayMobile, firstPage, type Page, type PageQuery } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { DataTable, type Column, type TableStatus } from "../../ui/table";
import { listPatients, type PatientListRow } from "./api";
import "./patients.css";

const GENDER_LABEL = { female: "Female", male: "Male", other: "Other" } as const;

const COLUMNS: Column<PatientListRow>[] = [
  {
    key: "full_name",
    label: "Name",
    sortable: true,
    render: (r) => (
      <span className="patients-name">
        <span className="patients-name-main">{r.fullName}</span>
        <span className="muted patients-name-meta">
          {r.ageYearsAtReg != null ? `${r.ageYearsAtReg} yrs, ` : ""}
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

// S02 (laptop) / S15 (phone): patient list. Filters (new this month, archived) arrive in 2.2.5.
export function PatientsScreen() {
  const [query, setQuery] = useState<PageQuery>(firstPage("full_name"));
  const [page, setPage] = useState<Page<PatientListRow> | null>(null);
  const [status, setStatus] = useState<TableStatus>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus({ state: "loading" });
    listPatients(query)
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
  }, [query, attempt]);

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
