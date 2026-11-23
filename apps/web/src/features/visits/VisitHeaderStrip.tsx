import { istDate } from "@clinic/shared";
import { Link } from "react-router";
import { formatDate } from "../../ui/format";
import { initials } from "../../ui/names";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusLabel } from "../../ui/StatusLabel";
import { ProfileAlerts } from "../medical-history";
import type { PatientDetail } from "../patients";
import type { VisitSummary } from "./api";
import { patientStripFacts } from "./visit-patient-strip";

type Props = {
  visit: VisitSummary;
  patient: PatientDetail;
  canViewClinical: boolean;
  canSeeFlags: boolean;
  onPastVisits: () => void;
};

/** Top of the visit: who, status, and the alerts that must always be seen (Visit.dc.html). */
export function VisitHeaderStrip({
  visit,
  patient,
  canViewClinical,
  canSeeFlags,
  onPastVisits,
}: Props) {
  const facts = patientStripFacts(patient, istDate(new Date()));
  const profile = `/app/patients/${patient.id}`;
  return (
    <header className={`card v1-head${visit.status === "void" ? " is-void" : ""}`}>
      <div className="v1-avatar" aria-hidden="true">
        {initials(patient.fullName)}
      </div>
      <div className="v1-head-main">
        <div className="v1-head-title">
          <h1>{patient.fullName}</h1>
          <PatientNoChip patientNo={patient.code} />
          <StatusLabel kind="visit" value={visit.status} />
        </div>
        <p className="muted v1-head-facts">
          <span>{facts.ageGender}</span>
          <span>{facts.mobile}</span>
          <span>{formatDate(visit.visitDateLocal)}</span>
          <Link to={`${profile}?tab=overview`}>Patient details</Link>
          <button type="button" className="v1-linkbtn" onClick={onPastVisits}>
            Past visits
          </button>
        </p>
        {visit.status === "void" ? <p className="muted small">Entered in error</p> : null}
      </div>
      <ProfileAlerts
        patientId={patient.id}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
      />
    </header>
  );
}
