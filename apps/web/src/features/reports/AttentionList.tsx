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
    <section className="dash-attention card">
      <h2>Things to watch</h2>
      <ul>
        <li>
          <Link to="/app/billing">Outstanding dues over 60 days</Link> — open Billing → Dues
        </li>
        <li>Incomplete treatment and recall — see Call lists above</li>
        <li>
          <Link to="/app">Incomplete visits</Link> — drafts on Today
        </li>
        {requests && requests.open > 0 && (
          <li className={requests.overdue > 0 ? "notice warning" : undefined}>
            <Link to="/app/requests">Patient requests</Link> — {requests.open} open
            {requests.overdue > 0 ? `, ${requests.overdue} past due date` : ""}
          </li>
        )}
        <li className={backupClass}>{backup?.text ?? "Last backup: not reported yet"}</li>
      </ul>
    </section>
  );
}
