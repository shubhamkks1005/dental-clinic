import { Link } from "react-router";

/** 6.3.3: "Things to watch" — stubs until 6.3.7 call lists / backup status. */
export function AttentionList() {
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
        <li>Storage and last backup — Settings when those panels are ready</li>
      </ul>
    </section>
  );
}
