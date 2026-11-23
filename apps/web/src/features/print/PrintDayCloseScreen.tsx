import { formatDisplayDate, formatRupees, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PrintLayout, printTitle } from "../../ui/print";
import { getDayClose, type DayCloseSummary } from "../billing/api";
import { SAMPLE_CLINIC } from "./sample-print-data";
import "./print-screen.css";

/** A4 day close summary (5.3.9). English only; no browser header text. */
export function PrintDayCloseScreen() {
  const [params] = useSearchParams();
  const dayLocal =
    params.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(params.get("date")!)
      ? params.get("date")!
      : istDate(new Date());
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const before = document.title;
    document.title = printTitle("Day close", dayLocal, formatDisplayDate(dayLocal));
    return () => {
      document.title = before;
    };
  }, [dayLocal]);

  useEffect(() => {
    getDayClose(dayLocal)
      .then(setSummary)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load day close.");
      });
  }, [dayLocal]);

  if (error) {
    return (
      <p className="error-text">
        {error} <Link to="/app/billing">Back</Link>
      </p>
    );
  }
  if (!summary) return <p className="muted">Loading…</p>;

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          Print
        </button>
        <Link to="/app/billing" className="btn secondary">
          Back
        </Link>
      </div>
      <PrintLayout size="A4" header="print" clinic={SAMPLE_CLINIC}>
        <h1 className="title-sm">Daily cash close · {formatDisplayDate(dayLocal)}</h1>
        <p>
          Payments: {summary.paymentCount} · Total {formatRupees(summary.totalPaise)}
        </p>
        <ul>
          {Object.entries(summary.modeTotals).map(([m, paise]) =>
            paise > 0 ? (
              <li key={m}>
                {m}: {formatRupees(paise)}
              </li>
            ) : null,
          )}
        </ul>
        <p>
          Cash expected: {formatRupees(summary.cashExpectedPaise)} · Digital:{" "}
          {formatRupees(summary.digitalPaise)}
        </p>
        {summary.close ? (
          <p>
            Counted cash: {formatRupees(summary.close.cashCountedPaise)} · Difference:{" "}
            {formatRupees(summary.close.differencePaise)}
            {summary.close.note ? ` · Note: ${summary.close.note}` : ""}
          </p>
        ) : (
          <p>Day not closed yet.</p>
        )}
      </PrintLayout>
    </div>
  );
}
