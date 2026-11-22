import { registrationMissing, type SettingKey } from "@clinic/shared";
import type { ClinicHeader } from "../../ui/print";

type SettingRow = { key: string; value: unknown };

function text(settings: SettingRow[], key: SettingKey, fallback = ""): string {
  const row = settings.find((s) => s.key === key);
  return typeof row?.value === "string" ? row.value : fallback;
}

/** Build print letterhead from Settings (4.3.2). */
export function clinicHeaderFromSettings(settings: SettingRow[]): ClinicHeader {
  return {
    name: text(settings, "clinic.name", "Clinic"),
    tagline: text(settings, "clinic.tagline"),
    logo: null,
    doctorName: text(settings, "doctor.name", "Doctor"),
    qualifications: text(settings, "doctor.qualifications"),
    speciality: text(settings, "doctor.speciality"),
    registrationNo: text(settings, "doctor.registration_no"),
    address: text(settings, "clinic.address"),
    phone: text(settings, "clinic.phone"),
  };
}

export function clinicRegistrationMissing(settings: SettingRow[]): boolean {
  return registrationMissing(clinicHeaderFromSettings(settings).registrationNo);
}
