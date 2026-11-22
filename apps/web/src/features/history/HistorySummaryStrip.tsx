import { formatRupees, toHhmm } from "@clinic/shared";
import { Link } from "react-router";
import type { HistorySummary } from "./api";

type Props = {
  summary: HistorySummary;
  patientId: string;
};

/** 3.5.11: pinned strip at top of History tab (S04/S17). */
export function HistorySummaryStrip({ summary, patientId }: Props) {
  const next = summary.nextAppointment;
  return (
    <dl className="history-summary" aria-label="History summary">
      <div>
        <dt>First visit</dt>
        <dd>{summary.firstVisitDate ?? "—"}</dd>
      </div>
      <div>
        <dt>Last visit</dt>
        <dd>{summary.lastVisitDate ?? "—"}</dd>
      </div>
      <div>
        <dt>Total visits</dt>
        <dd>{summary.totalVisits}</dd>
      </div>
      <div>
        <dt>Alerts</dt>
        <dd>
          {!summary.hasAlert
            ? "None"
            : summary.alertLabels.length > 0
              ? summary.alertLabels.join(", ")
              : summary.hasRestricted
                ? "Doctor to check (restricted)"
                : "Alert on file"}
        </dd>
      </div>
      <div>
        <dt>Outstanding</dt>
        <dd>{formatRupees(summary.outstandingDuePaise)}</dd>
      </div>
      <div>
        <dt>Next appointment</dt>
        <dd>
          {next ? (
            `${next.dateLocal} · ${toHhmm(next.startMin)} · ${next.visitTypeLabel}`
          ) : (
            <>
              None.{" "}
              <Link to={`/app/appointments?patient=${encodeURIComponent(patientId)}`}>Book</Link>
            </>
          )}
        </dd>
      </div>
    </dl>
  );
}
