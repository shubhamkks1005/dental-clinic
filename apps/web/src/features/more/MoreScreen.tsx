import { Link } from "react-router";
import { lastRequestId } from "../../api/last-request";
import { CopyButton } from "../../ui/CopyButton";
import { icons } from "../../ui/icons";
import { moreItems } from "../../ui/shell/nav-items";
import { useMe, UserCard } from "../auth";
import "./more.css";

// Phone "More" tab (no mockup; built from the S14 cards): who is signed in, Sign out, and the
// screens that have no bottom tab, filtered by role.
export function MoreScreen() {
  const { permissions } = useMe();
  const items = moreItems(permissions);
  return (
    <div className="more">
      <h1>More</h1>
      <section className="card more-card" aria-label="Signed in">
        <UserCard />
      </section>
      {items.length > 0 && (
        <nav className="card more-list" aria-label="More screens">
          {items.map((item) => (
            <Link key={item.to} to={item.to}>
              {icons[item.icon]}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {permissions.includes("requests.view") && (
        <nav className="card more-list" aria-label="Patient requests">
          <Link to="/app/requests">{icons.patients}Patient requests</Link>
        </nav>
      )}
      <HelpCard canSeeErrorLog={permissions.includes("errors.view")} />
    </div>
  );
}

// For bug reports: the Error ID of the last thing the app asked the server.
function HelpCard({ canSeeErrorLog }: { canSeeErrorLog: boolean }) {
  const id = lastRequestId();
  return (
    <section className="card more-card" aria-label="Help">
      <h2>Help</h2>
      {id ? (
        <p>
          Last Error ID: <strong>{id}</strong> <CopyButton text={id} />
        </p>
      ) : (
        <p className="muted">No Error ID yet. Open a screen, then come back here.</p>
      )}
      {canSeeErrorLog && <Link to="/app/errors">Open the error log</Link>}
    </section>
  );
}
