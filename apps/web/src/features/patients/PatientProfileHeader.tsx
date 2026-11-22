import {
  displayAge,
  displayMobile,
  istDate,
  type PatientGender,
  type PatientStatus,
} from "@clinic/shared";
import { Link } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusBadge } from "../../ui/StatusBadge";

const GENDER: Record<PatientGender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

export type ProfileHeaderPatient = {
  id: string;
  code: string;
  fullName: string;
  gender: PatientGender;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  createdAt: string;
  mobile: string | null;
  status: PatientStatus;
};

// S04 / S17 header: name, age, gender, code, mobile; alerts arrive in Phase 3.
export function PatientProfileHeader({ patient }: { patient: ProfileHeaderPatient }) {
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
      <p className="muted patient-profile-alerts">Alerts will show here later.</p>
    </header>
  );
}
