import type { SettingKey } from "@clinic/shared";

export type ClinicField = { key: SettingKey; label: string; multiline?: boolean };

export const CLINIC_FIELDS: ClinicField[] = [
  { key: "clinic.name", label: "Clinic name" },
  { key: "clinic.tagline", label: "Tagline" },
  { key: "clinic.kind", label: "Kind of clinic" },
  { key: "clinic.address", label: "Address", multiline: true },
  { key: "clinic.phone", label: "Clinic phone" },
  { key: "clinic.email", label: "Email" },
  { key: "clinic.instagram", label: "Instagram name" },
];

export const DOCTOR_FIELDS: ClinicField[] = [
  { key: "doctor.name", label: "Doctor name" },
  { key: "doctor.qualifications", label: "Qualifications" },
  { key: "doctor.speciality", label: "Speciality" },
  { key: "doctor.extra_line", label: "Extra line under speciality" },
  { key: "doctor.registration_no", label: "Registration number" },
];

export const ALL_CLINIC_FIELDS: ClinicField[] = [...CLINIC_FIELDS, ...DOCTOR_FIELDS];

const isSample = (v: string) => v.trim() === "" || /sample/i.test(v);

/** A sentence under each field that still holds the install placeholder (shown in amber). */
export function fieldWarnings(draft: Record<string, string>): Partial<Record<SettingKey, string>> {
  const get = (k: SettingKey) => draft[k] ?? "";
  const out: Partial<Record<SettingKey, string>> = {};
  if (isSample(get("doctor.name")))
    out["doctor.name"] = "This is still the sample name. It prints on every prescription.";
  if (get("doctor.registration_no").trim() === "")
    out["doctor.registration_no"] = "Required before you print a prescription or certificate.";
  if (/^0*$/.test(get("clinic.phone").replace(/\D/g, "")))
    out["clinic.phone"] = "This is a sample number. Patients will see it on messages and prints.";
  if (isSample(get("clinic.address")))
    out["clinic.address"] =
      "This is still the sample address. It prints at the foot of every page.";
  return out;
}
