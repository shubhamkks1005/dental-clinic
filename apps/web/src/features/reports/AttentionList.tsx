import { Link } from "react-router";

type BackupLine = { tone: "ok" | "warn" | "bad"; text: string };

/** 6.3.3 / 9.1.10: Things to watch — dues, call lists, visits, last backup. */
type Requests = { open: number; overdue: number };

export function AttentionList({
  backup,
  requests,
}: {
  backup?: BackupLine | null;
  requests?: Requests | null;
}) {
  const backupClass =
    backup?.tone === "bad" ? "notice error" : backup?.tone === "warn" ? "notice warning" : "muted";
  return (
    <section className="dash-attention card" aria-label="Things to watch">
      <h2>Things to watch</h2>
      <ul className="watch-list">
        <li>
          <Link to="/app/billing">
            <span>Dues over 60 days</span>
            <span className="muted small">Open Billing, Dues</span>
          </Link>
        </li>
        <li>
          <Link to="/app">
            <span>Unfinished visits</span>
            <span className="muted small">Drafts waiting on Today</span>
          </Link>
        </li>
        {requests && requests.open > 0 && (
          <li className={requests.overdue > 0 ? "notice warning" : undefined}>
            <Link to="/app/requests">
              <span>Patient requests</span>
              <span className="muted small">
                {requests.open} open
                {requests.overdue > 0 ? `, ${requests.overdue} past due date` : ""}
              </span>
            </Link>
          </li>
        )}
        <li className={backupClass}>{backup?.text ?? "Last backup: not reported yet"}</li>
      </ul>
    </section>
  );
}
