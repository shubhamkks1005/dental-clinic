import { firstPage, type Page, type PageQuery } from "@clinic/shared";
import { useEffect, useState } from "react";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { DataTable, type Column, type TableStatus } from "../../ui/table";
import { samplePage, type SampleRow } from "./sample-table";

const COLUMNS: Column<SampleRow>[] = [
  { key: "name", label: "Name", sortable: true, render: (r) => r.name },
  {
    key: "code",
    label: "Patient no.",
    sortable: true,
    render: (r) => <PatientNoChip patientNo={r.code} />,
  },
  {
    key: "visits",
    label: "Visits",
    sortable: true,
    sortText: { asc: "fewest first", desc: "most first" },
    render: (r) => r.visits,
  },
];

const FAKE_DELAY_MS = 250;

// The data table kit over 5,000 FAKE rows, with a pretend server delay and failure.
export function SampleTable() {
  const [query, setQuery] = useState<PageQuery>(firstPage("name"));
  const [page, setPage] = useState<Page<SampleRow> | null>(null);
  const [status, setStatus] = useState<TableStatus>({ state: "loading" });
  const [serverDown, setServerDown] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus({ state: "loading" });
    const timer = setTimeout(() => {
      if (serverDown) {
        setStatus({
          state: "error",
          message: "Could not load the list. Check the internet connection, then try again.",
        });
        return;
      }
      setPage(samplePage(query));
      setStatus({ state: "ready" });
    }, FAKE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, serverDown, attempt]);

  return (
    <>
      <label className="guide-check">
        <input
          type="checkbox"
          checked={serverDown}
          onChange={(e) => setServerDown(e.target.checked)}
        />
        Pretend the server is down
      </label>
      <DataTable
        caption="Sample patients (fake)"
        filterLabel="Search by name or patient number"
        emptyText="No patient matches this search."
        columns={COLUMNS}
        page={page}
        query={query}
        onQuery={setQuery}
        rowKey={(r) => r.id}
        status={status}
        onRetry={() => {
          setServerDown(false);
          setAttempt((n) => n + 1);
        }}
      />
    </>
  );
}
