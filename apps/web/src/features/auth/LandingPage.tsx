import { useEffect, useState } from "react";
import { StatusBadge } from "../../ui/StatusBadge";
import { devSignInUrl, getMe, SIGN_IN_URL } from "./api";
import { ClinicBrand } from "./ClinicBrand";
import "./auth.css";

// S20 Start (new screen, built from S18). One staff button for every role: the role comes only
// from the staff list. The patient card stays disabled until Phase 8.
export function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    getMe()
      .then(() => setSignedIn(true))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <main className="start">
      <ClinicBrand />
      <div className="start-cards">
        <section className="card start-card" aria-labelledby="staff-title">
          <h1 id="staff-title">Clinic staff</h1>
          <p className="muted">For the doctor and the receptionist.</p>
          {signedIn ? (
            <a className="btn btn-primary" href="/app">
              Continue to the app
            </a>
          ) : (
            <a className="btn btn-primary" href={SIGN_IN_URL}>
              Sign in with Google
            </a>
          )}
          <p className="small muted">Use the Gmail address the clinic added for you.</p>
          {import.meta.env.DEV && (
            <p className="small">
              Local only: <a href={devSignInUrl("doctor")}>dev doctor</a> ·{" "}
              <a href={devSignInUrl("receptionist")}>dev receptionist</a>
            </p>
          )}
        </section>
        <section
          className="card start-card start-card-off"
          aria-labelledby="patients-title"
          aria-disabled="true"
        >
          <h2 id="patients-title">Patients</h2>
          <StatusBadge tone="upcoming" label="Coming soon" />
          <p className="muted">
            Soon you will see your appointments, prescriptions and bills here.
          </p>
        </section>
      </div>
    </main>
  );
}
