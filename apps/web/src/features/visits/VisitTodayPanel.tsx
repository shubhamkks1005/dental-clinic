import type { VisitSummary } from "./api";

type Props = {
  visit: VisitSummary;
};

/**
 * 3.5.2 shell for Today's visit. Complaint / exam / diagnosis fields land in 3.5.3.
 * Keep this panel short so the doctor can work without scrolling on a laptop.
 */
export function VisitTodayPanel({ visit }: Props) {
  return (
    <div className="visit-today">
      <p className="muted small">
        Notes, diagnosis and advice open here next. Chart, plan and files use the tabs above.
      </p>
      <dl className="visit-today-meta">
        <div>
          <dt>Date</dt>
          <dd>{visit.visitDateLocal}</dd>
        </div>
        <div>
          <dt>Complaint</dt>
          <dd>{visit.chiefComplaint?.trim() || "Not filled yet"}</dd>
        </div>
        <div>
          <dt>Advice</dt>
          <dd>{visit.advice?.trim() || "Not filled yet"}</dd>
        </div>
      </dl>
    </div>
  );
}
