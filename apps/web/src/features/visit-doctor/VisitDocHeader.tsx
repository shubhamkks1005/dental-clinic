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
        <div className="vd-head-left">
          <Link to="/app" className="vd-back">
            <span className="vd-icon" aria-hidden="true">
              arrow_back
            </span>
            <span>Today</span>
          </Link>
          <h1 className="vd-name">{patient.fullName}</h1>
          <span className="vd-sub">{facts.ageGender}</span>
          <span className="vd-code">{patient.code}</span>
        </div>
        <div className="vd-head-right">
          <span className="vd-head-note">Smart Collapsible Accordions</span>
          <Link className="vd-add-file" to={`/app/patients/${patient.id}?tab=files`}>
            + Add file
          </Link>
        </div>
      </div>
      <div className="vd-strip" aria-label="Patient alerts">
        <ProfileAlerts
          patientId={patient.id}
          canViewClinical={canViewClinical}
          canSeeFlags={canSeeFlags}
        />
        {bp && (
          <span className="vd-chip">
            <span className="vd-icon vd-chip-icon vd-chip-icon-primary" aria-hidden="true">
              monitor_heart
            </span>
            <span>{bp}</span>
          </span>
        )}
        {dues && (
          <button type="button" className="vd-chip vd-chip-error" onClick={onDues}>
            <span className="vd-icon vd-chip-icon" aria-hidden="true">
              account_balance_wallet
            </span>
            <span>{dues}</span>
          </button>
        )}
        {follow && (
          <span className={`vd-chip ${page.followUp?.state === "late" ? "vd-chip-warning" : ""}`}>
            <span className="vd-icon vd-chip-icon" aria-hidden="true">
              schedule
            </span>
            <span>{follow}</span>
          </span>
        )}
      </div>
    </header>
  );
}
