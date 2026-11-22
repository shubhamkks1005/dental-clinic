import { displayAge, displayMobile, istDate, type PatientGender } from "@clinic/shared";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { StatusBadge } from "../../ui/StatusBadge";
import { ProfileAlerts } from "../medical-history";
import { openOrReuseVisit } from "../visits/open-visit";
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
  canEditClinical?: boolean;
};

// S04 / S17 header: name, age, gender, code, mobile, contact (2.2.8); alerts 3.3.2; New visit 3.5.1.
export function PatientProfileHeader({
  patient,
  canViewClinical,
  canSeeFlags,
  canEditClinical = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function onNewVisit() {
    setBusy(true);
    setError(null);
    try {
      const visitId = await openOrReuseVisit({ patientId: patient.id, visitDateLocal: today });
      navigate(`/app/visits/${visitId}`);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not open the visit. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="patient-profile-head">
      <p className="patient-profile-back">
        <Link to="/app/patients">← Patients</Link>
      </p>
      <div className="patient-profile-title-row">
        <h1>{patient.fullName}</h1>
        {patient.status === "archived" && <StatusBadge tone="upcoming" label="Archived" />}
        {canEditClinical ? (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onNewVisit}>
            {busy ? "Opening…" : "New visit"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
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
