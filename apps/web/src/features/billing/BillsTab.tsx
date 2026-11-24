import { billStatusKey, formatDate, formatMoney } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../ui/page/EmptyState";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusLabel } from "../../ui/StatusLabel";
import { searchBills, type BillSearchRow } from "./api";
import { TextInput } from "../../ui/form";

const STATUS_FILTERS = [
  { id: "", label: "All" },
  { id: "issued", label: "Issued" },
  { id: "draft", label: "Drafts" },
  { id: "cancelled", label: "Cancelled" },
];

// Billing > Bills: every bill, newest first, with search. No design file: built from the Dues
// list (Billing.dc.html) as the Billing design README says.
export function BillsTab() {
  const [q, setQ] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<BillSearchRow[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQ(typed);
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [typed]);

  useEffect(() => {
    let live = true;
    searchBills({ q, status, page })
      .then((r) => {
        if (!live) return;
        setRows(r.rows);
        setHasMore(r.hasMore);
        setError(null);
      })
      .catch(() => live && setError("Could not load bills. Check the connection and try again."));
    return () => {
      live = false;
    };
  }, [q, status, page]);

  return (
    <div className="hub-stack">
      <TextInput
        className="input"
        aria-label="Search bills"
        placeholder="Search a patient or bill number"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      <div className="hub-chips" role="group" aria-label="Filter bills">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`hub-chip${status === f.id ? " is-on" : ""}`}
            aria-pressed={status === f.id}
            onClick={() => {
              setStatus(f.id);
              setPage(0);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {rows && rows.length === 0 ? <EmptyState>No bills match.</EmptyState> : null}
      {rows && rows.length > 0 ? (
        <section className="card bills-card" aria-label="Bills">
          <ul className="bills-list">
            {rows.map((r) => (
              <li key={r.id}>
                <Link className="bills-row" to={`/app/bills/${r.id}`}>
                  <span className="bills-main">
                    <strong>{r.billNo ?? "Draft bill"}</strong>
                    <span className="muted">
                      {r.patientName} · {formatDate(r.billOn)}
                    </span>
                  </span>
                  <PatientNoChip patientNo={r.patientCode} />
                  <StatusLabel
                    kind="bill"
                    value={billStatusKey(r.status, r.totalPaise, r.paidPaise)}
                  />
                  <strong className="bills-amount">{formatMoney(r.totalPaise)}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="hub-pager">
        <button
          type="button"
          className="btn"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Newer
        </button>
        <button type="button" className="btn" disabled={!hasMore} onClick={() => setPage(page + 1)}>
          Older
        </button>
      </div>
    </div>
  );
}
