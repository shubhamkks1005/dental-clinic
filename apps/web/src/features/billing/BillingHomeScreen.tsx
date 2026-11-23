import { Link } from "react-router";

/** S09 entry: billing home. Patient bills live on the profile Billing tab. */
export function BillingHomeScreen() {
  return (
    <section className="stack gap-md" aria-label="Billing">
      <h1 className="title-md">Billing</h1>
      <p className="muted">
        Open a patient and use the Billing tab for their account, or create a bill from a visit.
      </p>
      <p>
        <Link to="/app/patients" className="btn">
          Find a patient
        </Link>
      </p>
      <p className="muted small">
        Dues list and daily cash close come next. Tax is off until the accountant confirms.
      </p>
    </section>
  );
}
