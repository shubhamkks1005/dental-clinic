import { displayMobile } from "@clinic/shared";
import { useState } from "react";
import { Link } from "react-router";
import type { PatientDetail } from "./api";
import { ConsentsPanel } from "./ConsentsPanel";
import { PatientEditForm } from "./PatientEditForm";

type Props = {
  patient: PatientDetail;
  canEdit: boolean;
  onPatientChange: (patient: PatientDetail) => void;
};

// Overview: next appointment, details (or edit), consents.
export function PatientOverviewTab({ patient, canEdit, onPatientChange }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PatientEditForm
        patient={patient}
        onSaved={(next) => {
          onPatientChange(next);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

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
        <div className="patient-overview-details-head">
          <h2 id="details-title">Details</h2>
          {canEdit && (
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
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
