import { useEffect, useState } from "react";
import type { DashboardPayload, DashboardRangePreset } from "@clinic/shared";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { useToast } from "../../ui/Toast";
import { AttentionList } from "./AttentionList";
import { CallListsPanel } from "./CallListsPanel";
import { Link } from "react-router";
import { fetchDashboard, fetchStatsCsv, recomputeStats } from "./api";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardKpis } from "./DashboardKpis";
import { RangeControls } from "./RangeControls";
import { TodaySummaryCard } from "./TodaySummaryCard";
import "./reports.css";

/** S10 Reports / doctor dashboard (6.3.3–6.3.8). */
export function ReportsScreen() {
  const { permissions } = useMe();
  const toast = useToast();
  const canFull = permissions.includes("reports.full");
  const canToday = permissions.includes("reports.today");
  const [range, setRange] = useState<DashboardRangePreset>("this_month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compare, setCompare] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canFull) return;
    if (range === "custom" && (!from || !to)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchDashboard({ range, from, to, compare })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(problemText(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canFull, range, from, to, compare]);

  async function onRecompute() {
    if (busy) return;
    setBusy(true);
    try {
      const { days } = await recomputeStats();
      toast({ text: `Stats updated for ${days.join(", ")}.`, tone: "ok" });
      const d = await fetchDashboard({ range, from, to, compare });
      setData(d);
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!canFull) {
    return (
      <div className="reports-page">
        <header className="reports-header">
          <h1>Reports</h1>
        </header>
        {canToday ? <TodaySummaryCard /> : null}
        <p className="notice warning">
          The full dashboard is for the doctor. You can use Today for the live queue.
        </p>
      </div>
    );
  }

  return (
    <div className="reports-page reports-page-wide">
      <header className="reports-header">
        <h1>Reports</h1>
        <p className="reports-sample">Clinic totals</p>
      </header>

      <RangeControls
        range={range}
        from={from}
        to={to}
        compare={compare}
        onRange={setRange}
        onFrom={setFrom}
        onTo={setTo}
        onCompare={setCompare}
      />

      <div className="dash-toolbar">
        <button type="button" className="btn" disabled={busy} onClick={() => void onRecompute()}>
          {busy ? "Updating…" : "Recompute now"}
        </button>
        <Link
          className="btn btn-secondary"
          to={`/app/print/monthly-report?month=${new Date().toISOString().slice(0, 7)}`}
        >
          Print this month
        </Link>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!data}
          onClick={() => {
            if (!data) return;
            void fetchStatsCsv(data.range.from, data.range.to)
              .then((out) => {
                const blob = new Blob([out.csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `clinic-stats-${out.from}_${out.to}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              })
              .catch((err) => toast({ text: problemText(err), tone: "error" }));
          }}
        >
          Download CSV
        </button>
        {loading ? <span className="muted">Loading…</span> : null}
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      {data ? (
        <>
          <DashboardKpis kpis={data.kpis} />
          <DashboardCharts data={data} />
          <CallListsPanel />
          <AttentionList backup={data.attention?.backup} requests={data.attention?.requests} />
        </>
      ) : null}
    </div>
  );
}
