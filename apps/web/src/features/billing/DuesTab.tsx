import { daysBetweenOn, istDate, type DueAgeBucket } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../ui/page/EmptyState";
import { AgeingCards } from "./AgeingCards";
import { listDues, type DuesRow } from "./api";
import { DuesRowItem } from "./DuesRowItem";

type Filter = "all" | "over30" | "over60" | "notCalled";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "over30", label: "Over 30 days" },
  { id: "over60", label: "Over 60 days" },
  { id: "notCalled", label: "Not called this week" },
];

function keep(filter: Filter, r: DuesRow, today: string): boolean {
  if (filter === "over30") return r.daysOutstanding > 30;
  if (filter === "over60") return r.daysOutstanding > 60;
  if (filter === "notCalled") return !r.lastCallOn || daysBetweenOn(r.lastCallOn, today) >= 7;
  return true;
}

// Billing > Dues (Billing.dc.html, PhoneBilling.dc.html): who owes money, oldest first.
export function DuesTab() {
  const [rows, setRows] = useState<DuesRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [byBucket, setByBucket] = useState<Record<DueAgeBucket, number>>({
    "0-30": 0,
    "31-60": 0,
    "61+": 0,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listDues()
      .then((r) => {
        setRows(r.rows);
        setTotal(r.totalDuePaise);
        setByBucket(r.byBucket);
      })
      .catch(() => setError("Could not load the dues. Check the connection and reload."));
  }, []);
  useEffect(load, [load]);

  if (error) return <p className="field-error">{error}</p>;
  if (!rows) return <p className="muted">Loading…</p>;
  const today = istDate(new Date());
  const shown = rows.filter((r) => keep(filter, r, today));

  return (
    <div className="hub-stack">
      <AgeingCards total={total} byBucket={byBucket} rows={rows} />
      <div className="hub-chips" role="group" aria-label="Filter dues">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`hub-chip${filter === f.id ? " is-on" : ""}`}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState>
          {rows.length === 0 ? "Nobody owes money right now." : "No one matches this filter."}
        </EmptyState>
      ) : (
        <section className="card dues-card" aria-label="Patients who owe money">
          <div className="dues-head" aria-hidden="true">
            <span>PATIENT</span>
            <span>DUE</span>
            <span>OLDEST BILL</span>
            <span>LAST CALL NOTE</span>
            <span>ACTIONS</span>
          </div>
          <ul className="dues-list">
            {shown.map((r) => (
              <DuesRowItem key={r.patientId} row={r} onSaved={load} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
