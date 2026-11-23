import { useState } from "react";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { useToast } from "../../ui/Toast";
import { recomputeStats } from "./api";
import "./reports.css";

/** S10 Reports — sample-data label until dashboard (6.3); recompute control (6.2.3). */
export function ReportsScreen() {
  const { permissions } = useMe();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const canFull = permissions.includes("reports.full");

  async function onRecompute() {
    if (busy) return;
    setBusy(true);
    try {
      const { days } = await recomputeStats();
      toast({ text: `Stats updated for ${days.join(", ")}.`, tone: "ok" });
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>Reports</h1>
        <p className="reports-sample">Sample data</p>
      </header>
      <p className="reports-lead">
        Dashboard charts come next. You can refresh clinic totals for the last three days now.
      </p>
      {canFull ? (
        <button type="button" className="btn" disabled={busy} onClick={() => void onRecompute()}>
          {busy ? "Updating…" : "Recompute now"}
        </button>
      ) : (
        <p className="notice warning">Only the doctor can recompute full reports.</p>
      )}
    </div>
  );
}
