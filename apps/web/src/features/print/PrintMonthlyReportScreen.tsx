import { formatRupees } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { problemText } from "../../api/problem-text";
import { PrintLayout, printTitle } from "../../ui/print";
import { fetchDashboard } from "../reports/api";
import type { DashboardPayload } from "@clinic/shared";
import { SAMPLE_CLINIC } from "./sample-print-data";
import "./print-screen.css";

/** 6.4.1: A4 monthly clinic report (aggregates only). Waiting: sister print haan. */
export function PrintMonthlyReportScreen() {
  const [params] = useSearchParams();
  const month = /^\d{4}-\d{2}$/.test(params.get("month") ?? "")
    ? params.get("month")!
    : new Date().toISOString().slice(0, 7);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const before = document.title;
    document.title = printTitle("Monthly report", month, month);
    return () => {
      document.title = before;
    };
  }, [month]);

  useEffect(() => {
    const from = `${month}-01`;
    const [y, m] = month.split("-").map(Number) as [number, number];
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const to = `${month}-${String(last).padStart(2, "0")}`;
    fetchDashboard({ range: "custom", from, to, compare: true })
      .then(setData)
      .catch((e: unknown) => setError(problemText(e)));
  }, [month]);

  if (error) {
    return (
      <p className="error-text">
        {error} <Link to="/app/reports">Back</Link>
      </p>
    );
  }
  if (!data) return <p className="muted">Loading…</p>;

  const t = data.totals;
  const c = data.compareTotals;

  return (
    <div className="print-screen">
      <div className="print-screen-toolbar no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          Print
        </button>
        <Link to="/app/reports" className="btn secondary">
          Back
        </Link>
      </div>
      <PrintLayout size="A4" header="print" clinic={SAMPLE_CLINIC}>
        <h1 className="title-sm">Monthly report · {month}</h1>
        <p className="muted">Clinic totals only. No patient names.</p>
        <table className="print-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>This month</th>
              <th>Previous</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Arrived</td>
              <td>{t.arrived}</td>
              <td>{c?.arrived ?? "—"}</td>
            </tr>
            <tr>
              <td>New</td>
              <td>{t.newPatients}</td>
              <td>{c?.newPatients ?? "—"}</td>
            </tr>
            <tr>
              <td>Returning</td>
              <td>{t.returning}</td>
              <td>{c?.returning ?? "—"}</td>
            </tr>
            <tr>
              <td>No-show</td>
              <td>{t.noshow}</td>
              <td>{c?.noshow ?? "—"}</td>
            </tr>
            <tr>
              <td>Cancelled</td>
              <td>{t.cancelled}</td>
              <td>{c?.cancelled ?? "—"}</td>
            </tr>
            <tr>
              <td>Billed</td>
              <td>{formatRupees(t.billedPaise)}</td>
              <td>{c ? formatRupees(c.billedPaise) : "—"}</td>
            </tr>
            <tr>
              <td>Collected</td>
              <td>{formatRupees(t.collectedPaise)}</td>
              <td>{c ? formatRupees(c.collectedPaise) : "—"}</td>
            </tr>
          </tbody>
        </table>
        {data.procedures.length > 0 ? (
          <>
            <h2 className="title-sm">Top procedures</h2>
            <ul>
              {data.procedures.map((p) => (
                <li key={p.dim}>
                  {p.dim}: {p.value}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {data.referrals.length > 0 ? (
          <>
            <h2 className="title-sm">Top referrals</h2>
            <ul>
              {data.referrals.map((r) => (
                <li key={r.dim}>
                  {r.dim}: {r.value}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="muted">DRAFT - sister to confirm layout on clinic printer.</p>
      </PrintLayout>
    </div>
  );
}
