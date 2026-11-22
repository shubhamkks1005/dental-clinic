import { SIGN_IN_URL } from "./api";
import { ClinicBrand } from "./ClinicBrand";
import "./auth.css";

// S21 Access not available (new screen, built from S18). Same page for every refusal, so it
// never reveals which emails are on the staff list.
export function AccessDenied() {
  return (
    <main className="start">
      <ClinicBrand />
      <section className="card start-card start-single" aria-labelledby="denied-title">
        <h1 id="denied-title">Access not available</h1>
        <p className="muted">
          This Google account can't open the clinic app. If you work at the clinic, ask the doctor
          to add your Gmail address, then try again.
        </p>
        <a className="btn btn-primary" href={SIGN_IN_URL}>
          Try another Google account
        </a>
        <a className="btn" href="/">
          Back to start
        </a>
      </section>
    </main>
  );
}
