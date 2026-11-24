import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import type { CreatedPatient } from "./api";
import { NewPatientForm, type AfterSave } from "./NewPatientForm";
import "./new-patient.css";

// S03 (laptop) / S16 (phone): new patient. Follows DESIGN.md patient-no preview rule.
export function NewPatientScreen() {
  const [created, setCreated] = useState<CreatedPatient | null>(null);
  const navigate = useNavigate();

  function onCreated(patient: CreatedPatient, next: AfterSave) {
    const q = `patient=${encodeURIComponent(patient.id)}`;
    if (next === "book") navigate(`/app/appointments?${q}`);
    else if (next === "checkin") navigate(`/app/appointments?${q}&walkin=1`);
    else setCreated(patient);
  }

  if (created) {
    return (
      <div className="new-patient">
        <header className="new-patient-head">
          <h1>Patient saved</h1>
          <p className="muted">
            {created.fullName} · <PatientNoChip patientNo={created.code} />
          </p>
        </header>
        <div className="new-patient-next">
          <Link
            className="btn btn-primary new-patient-next-btn"
            to={`/app/appointments?patient=${encodeURIComponent(created.id)}`}
          >
            Book appointment
          </Link>
          <Link
            className="btn new-patient-next-btn"
            to={`/app/appointments?patient=${encodeURIComponent(created.id)}&walkin=1`}
          >
            Walk-in now
          </Link>
          <Link className="btn new-patient-next-btn" to={`/app/patients/${created.id}`}>
            Open patient
          </Link>
        </div>
        <p>
          <Link to="/app/patients">Back to patients</Link>
          {" · "}
          <button type="button" className="btn btn-ghost" onClick={() => setCreated(null)}>
            Add another
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="new-patient">
      <header className="new-patient-head">
        <h1>New patient</h1>
        <p className="muted">
          <span className="chip">Patient no. is assigned when you save</span>
        </p>
      </header>
      <NewPatientForm onCreated={onCreated} />
    </div>
  );
}
