import { useEffect, useState } from "react";
import type { DashboardPayload, DashboardRangePreset } from "@clinic/shared";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { useToast } from "../../ui/Toast";
import { AttentionList } from "./AttentionList";
import { fetchDashboard, recomputeStats } from "./api";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardKpis } from "./DashboardKpis";
import { RangeControls } from "./RangeControls";
import "./reports.css";

/** S10 Reports / doctor dashboard (6.3.3–6.3.5). */
export function ReportsScreen() {
  const { permissions } = useMe();
  const toast = useToast();
  const canFull = permissions.includes("reports.full");
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
        <p className="notice warning">
          The full dashboard is for the doctor. Ask them for the clinic summary, or use Today for
          today&apos;s queue.
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
        {loading ? <span className="muted">Loading…</span> : null}
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      {data ? (
        <>
          <DashboardKpis kpis={data.kpis} />
          <DashboardCharts data={data} />
          <AttentionList />
        </>
      ) : null}
    </div>
  );
}
