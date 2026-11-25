import { istDate } from "@clinic/shared";
import { Link } from "react-router";
import { ProfileAlerts } from "../medical-history";
import type { PatientDetail } from "../patients";
import { patientStripFacts } from "../visits/visit-patient-strip";
import type { VisitPageData } from "./page-api";
import { bpText, duesText, followUpText } from "./strip-model";

type Props = {
  patient: PatientDetail;
  page: VisitPageData;
  canViewClinical: boolean;
  canSeeFlags: boolean;
  /** The Dues chip opens the History tab of the side pane. */
  onDues: () => void;
};

/** Back to Today, who the patient is, and the always-visible strip (allergy, vitals, dues, follow-up). */
export function VisitDocHeader({ patient, page, canViewClinical, canSeeFlags, onDues }: Props) {
  const today = istDate(new Date());
  const facts = patientStripFacts(patient, today);
  const bp = bpText(page.visit);
  const dues = duesText(page.duesPaise);
  const follow = followUpText(page.followUp, today);

  return (
    <header className="vd-head">
      <div className="vd-head-row">
        <Link to="/app" className="vd-back">
          <span aria-hidden="true">←</span>
          <span>Today</span>
        </Link>
        <h1 className="vd-name">{patient.fullName}</h1>
        <span className="vd-sub">{facts.ageGender}</span>
        <span className="vd-code">{patient.code}</span>
      </div>
      <div className="vd-strip" aria-label="Patient alerts">
        <ProfileAlerts
          patientId={patient.id}
          canViewClinical={canViewClinical}
          canSeeFlags={canSeeFlags}
        />
        {bp && <span className="vd-chip">{bp}</span>}
        {dues && (
          <button type="button" className="vd-chip vd-chip-error" onClick={onDues}>
            {dues}
          </button>
        )}
        {follow && (
          <span className={`vd-chip ${page.followUp?.state === "late" ? "vd-chip-warning" : ""}`}>
            {follow}
          </span>
        )}
      </div>
    </header>
  );
}
