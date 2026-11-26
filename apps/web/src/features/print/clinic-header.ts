import {
  consultationTimingsLines,
  registrationMissing,
  timingsSchema,
  type DoctorProfile,
  type SettingKey,
} from "@clinic/shared";
import type { ClinicHeader } from "../../ui/print";

type SettingRow = { key: string; value: unknown };

function text(settings: SettingRow[], key: SettingKey, fallback = ""): string {
  const row = settings.find((s) => s.key === key);
  return typeof row?.value === "string" ? row.value : fallback;
}

function timingsLines(settings: SettingRow[]): string[] {
  const parsed = timingsSchema.safeParse(settings.find((s) => s.key === "clinic.timings")?.value);
  return parsed.success ? consultationTimingsLines(parsed.data) : [];
}

/**
 * Build print letterhead from Settings (4.3.2). With several doctors (owner 2026-11-26) the doctor
 * lines come from the prescribing doctor's own profile; the old doctor.* settings are the fallback.
 */
export function clinicHeaderFromSettings(
  settings: SettingRow[],
  doctor: DoctorProfile | null = null,
): ClinicHeader {
  const base = clinicFromSettings(settings);
  if (!doctor) return base;
  return {
    ...base,
    doctorName: doctor.nameOnRx,
    qualifications: doctor.qualifications,
    speciality: doctor.speciality,
    registrationNo: doctor.registrationNo,
    extraLine: doctor.extraLine,
  };
}

function clinicFromSettings(settings: SettingRow[]): ClinicHeader {
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
    kind: text(settings, "clinic.kind"),
    email: text(settings, "clinic.email"),
    instagram: text(settings, "clinic.instagram"),
    extraLine: text(settings, "doctor.extra_line"),
    timingsLines: timingsLines(settings),
  };
}

export function clinicRegistrationMissing(
  settings: SettingRow[],
  doctor: DoctorProfile | null = null,
): boolean {
  return registrationMissing(clinicHeaderFromSettings(settings, doctor).registrationNo);
}
