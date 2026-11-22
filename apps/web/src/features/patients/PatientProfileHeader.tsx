import { displayAge, displayMobile, istDate, type PatientGender } from "@clinic/shared";
import { Link } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusBadge } from "../../ui/StatusBadge";
import { ProfileAlerts } from "../medical-history";
import type { PatientDetail } from "./api";

const GENDER: Record<PatientGender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

type HeaderProps = {
  patient: PatientDetail;
  canViewClinical: boolean;
  canSeeFlags: boolean;
};

// S04 / S17 header: name, age, gender, code, mobile, contact (2.2.8); alerts 3.3.2.
export function PatientProfileHeader({ patient, canViewClinical, canSeeFlags }: HeaderProps) {
  const today = istDate(new Date());
  const age = displayAge(
    {
      dateOfBirth: patient.dateOfBirth,
      ageYearsAtReg: patient.ageYearsAtReg,
      registeredOn: istDate(new Date(patient.createdAt)),
    },
    today,
  );
  const meta = [age, GENDER[patient.gender]].filter(Boolean).join(" · ");

  return (
    <header className="patient-profile-head">
      <p className="patient-profile-back">
        <Link to="/app/patients">← Patients</Link>
      </p>
      <div className="patient-profile-title-row">
        <h1>{patient.fullName}</h1>
        {patient.status === "archived" && <StatusBadge tone="upcoming" label="Archived" />}
      </div>
      <p className="muted patient-profile-meta">{meta}</p>
      <div className="patient-profile-chips">
        <PatientNoChip patientNo={patient.code} />
        <span className="patient-profile-mobile">
          {patient.mobile ? displayMobile(patient.mobile) : "No mobile"}
        </span>
      </div>
      {patient.contactMobile && (
        <p className="muted patient-profile-contact">
          Contact {displayMobile(patient.contactMobile)}
          {patient.contactRelation ? ` (${patient.contactRelation})` : ""}
          {patient.sameMobileCount > 0
            ? ` · ${patient.sameMobileCount} other${patient.sameMobileCount === 1 ? "" : "s"} on this number`
            : ""}
        </p>
      )}
      <ProfileAlerts
        patientId={patient.id}
        canViewClinical={canViewClinical}
        canSeeFlags={canSeeFlags}
      />
    </header>
  );
}

// Keep type import used for status narrowing in callers that pass a subset.
export type ProfileHeaderPatient = Pick<
  PatientDetail,
  | "id"
  | "code"
  | "fullName"
  | "gender"
  | "dateOfBirth"
  | "ageYearsAtReg"
  | "createdAt"
  | "mobile"
  | "status"
  | "contactMobile"
  | "contactRelation"
  | "sameMobileCount"
>;
