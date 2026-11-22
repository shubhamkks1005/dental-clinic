import { displayMobile } from "@clinic/shared";
import { Link } from "react-router";
import type { PatientDetail } from "./api";
import { ConsentsPanel } from "./ConsentsPanel";

// Overview: contact bits + next appointment slot + consents history (2.1.9).
export function PatientOverviewTab({ patient }: { patient: PatientDetail }) {
  return (
    <div className="patient-overview">
      <section className="patient-overview-next" aria-labelledby="next-appt-title">
        <h2 id="next-appt-title">Next appointment</h2>
        <p className="muted">No upcoming appointment.</p>
        <Link
          className="btn btn-primary"
          to={`/app/appointments?patient=${encodeURIComponent(patient.id)}`}
        >
          Book appointment
        </Link>
      </section>

      <section className="patient-overview-details" aria-labelledby="details-title">
        <h2 id="details-title">Details</h2>
        <dl className="patient-overview-dl">
          <div>
            <dt>Area</dt>
            <dd>{patient.area ?? "—"}</dd>
          </div>
          <div>
            <dt>Other mobile</dt>
            <dd>{patient.mobileSecondary ? displayMobile(patient.mobileSecondary) : "—"}</dd>
          </div>
          <div>
            <dt>Guardian</dt>
            <dd>
              {patient.guardianName
                ? `${patient.guardianName}${patient.guardianRelation ? ` (${patient.guardianRelation})` : ""}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{patient.notes ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <ConsentsPanel patientId={patient.id} />
    </div>
  );
}
