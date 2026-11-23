import { istDate } from "@clinic/shared";
import { Link } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import type { PatientDetail } from "../patients";
import { patientStripFacts } from "./visit-patient-strip";

/** Who the doctor is seeing, and the way to change their details without losing the visit. */
export function VisitPatientStrip({
  patient,
  dateLocal,
}: {
  patient: PatientDetail;
  dateLocal: string;
}) {
  const facts = patientStripFacts(patient, istDate(new Date()));
  const profile = `/app/patients/${patient.id}`;
  return (
    <div className="visit-patient">
      <p className="visit-patient-facts">
        <PatientNoChip patientNo={patient.code} />
        <span>{facts.ageGender}</span>
        <span>{facts.mobile}</span>
        <span className="muted">Visit {dateLocal}</span>
      </p>
      <p className="visit-patient-links">
        <Link to={`${profile}?tab=overview`}>Edit patient or medical history</Link>
        <Link to={`${profile}?tab=history`}>Past visits</Link>
      </p>
    </div>
  );
}
