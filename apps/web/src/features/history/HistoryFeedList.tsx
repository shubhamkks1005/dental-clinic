import { Link } from "react-router";
import { StatusBadge } from "../../ui/StatusBadge";
import type { HistoryFeedEntry } from "./api";

type Props = {
  entries: HistoryFeedEntry[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
};

const TYPE_LABEL: Record<HistoryFeedEntry["type"], string> = {
  appointment: "Appointment",
  visit: "Visit",
  treatment: "Treatment",
  prescription: "Prescription",
  certificate: "Certificate",
  file: "File",
  medical_change: "Medical",
  consent: "Consent",
  amendment: "Amendment",
};

/** 3.5.12: merged history rows + load more. */
export function HistoryFeedList({ entries, nextCursor, loadingMore, onLoadMore }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="history-feed">
      <ul className="history-feed-list">
        {entries.map((row) => (
          <li key={`${row.type}-${row.id}`}>
            <Link className="history-feed-row" to={row.href}>
              <span className="history-feed-meta">
                <span className="history-feed-date">{row.at.slice(0, 10)}</span>
                <StatusBadge tone="upcoming" label={TYPE_LABEL[row.type]} />
                {row.status ? <StatusBadge tone="done" label={row.status} /> : null}
              </span>
              <span className="history-feed-summary">{row.summary}</span>
              {row.actorName ? <span className="small muted">{row.actorName}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <button type="button" className="btn" disabled={loadingMore} onClick={onLoadMore}>
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
