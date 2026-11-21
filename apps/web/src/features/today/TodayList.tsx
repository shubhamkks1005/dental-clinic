import { Link } from "react-router";
import { StatusBadge } from "../../ui/StatusBadge";
import type { TodayRow } from "./sample-data";

// Phone: each row is its own card (S14). Tablet and laptop: one card with rows (S01).
export function TodayList({ rows }: { rows: TodayRow[] }) {
  return (
    <section className="today-list" aria-labelledby="today-list-title">
      <div className="today-list-head">
        <h2 id="today-list-title">Today's list</h2>
        <Link to="/app/appointments" className="today-link">
          Open calendar
        </Link>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.time + row.name} className="today-row">
            <span className="today-time">{row.time}</span>
            <span className="today-who">
              <span className="today-name">{row.name}</span>
              <span className="small muted">{row.visit}</span>
            </span>
            <StatusBadge tone={row.tone} label={row.status} />
            <button type="button" className="btn btn-compact today-action">
              {row.action}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
