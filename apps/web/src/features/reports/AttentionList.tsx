import { Link } from "react-router";

type BackupLine = { tone: "ok" | "warn" | "bad"; text: string };

/** 6.3.3 / 9.1.10: Things to watch — dues, call lists, visits, last backup. */
export function AttentionList({ backup }: { backup?: BackupLine | null }) {
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
        <li className={backupClass}>{backup?.text ?? "Last backup: not reported yet"}</li>
      </ul>
    </section>
  );
}
