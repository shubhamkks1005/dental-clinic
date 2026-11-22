import { VISIT_STATUS_LABEL } from "@clinic/shared";
import { Link } from "react-router";
import { StatusBadge } from "../../ui/StatusBadge";
import type { VisitRecent } from "./api";

type Props = {
  visits: VisitRecent[];
  currentVisitId: string;
};

/** 3.5.2: last visits beside the main tabs (S05). */
export function RecentVisitsSide({ visits, currentVisitId }: Props) {
  return (
    <aside className="visit-side" aria-label="Recent visits">
      <h2 className="visit-side-title">Last visits</h2>
      {visits.length === 0 ? (
        <p className="muted small">No earlier visits.</p>
      ) : (
        <ul className="visit-side-list">
          {visits.map((row) => {
            const current = row.id === currentVisitId;
            const summary = row.chiefComplaint?.trim() || "No complaint noted";
            return (
              <li
                key={row.id}
                className={current ? "visit-side-item is-current" : "visit-side-item"}
              >
                {current ? (
                  <span className="visit-side-link">
                    <span className="visit-side-date">{row.visitDateLocal}</span>
                    <StatusBadge
                      tone={row.status === "draft" ? "upcoming" : "done"}
                      label={VISIT_STATUS_LABEL[row.status]}
                    />
                    <span className="visit-side-summary">{summary}</span>
                    <span className="muted small">This visit</span>
                  </span>
                ) : (
                  <Link className="visit-side-link" to={`/app/visits/${row.id}`}>
                    <span className="visit-side-date">{row.visitDateLocal}</span>
                    <StatusBadge
                      tone={row.status === "draft" ? "upcoming" : "done"}
                      label={VISIT_STATUS_LABEL[row.status]}
                    />
                    <span className="visit-side-summary">{summary}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
