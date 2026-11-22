import { z } from "zod";
import { personNameField } from "./fields";
import { normaliseMobile } from "./mobile";
import { PATIENT_GENDERS, PATIENT_MESSAGE_LANGUAGES, type PatientGender } from "./patient-fields";
import { guardianSaveError, normalisedGuardian } from "./patient-guardian";

// Body for POST /api/staff/patients (2.2.1). Same rules in the form and the Worker.

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const createPatientBody = z.object({
  fullName: personNameField,
  gender: z.enum(PATIENT_GENDERS),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date of birth.")
    .optional()
    .nullable(),
  ageYearsAtReg: z.number().int().min(0).max(120).optional().nullable(),
  mobile: z.string().trim().optional().nullable(),
  noMobileReason: optionalText,
  mobileSecondary: z.string().trim().optional().nullable(),
  area: optionalText,
  email: optionalText,
  referralSourceId: optionalText,
  referredBy: optionalText,
  emergencyName: optionalText,
  emergencyRelation: optionalText,
  emergencyMobile: z.string().trim().optional().nullable(),
  guardianName: optionalText,
  guardianRelation: optionalText,
  guardianMobile: z.string().trim().optional().nullable(),
  messageLanguage: z.enum(PATIENT_MESSAGE_LANGUAGES).optional().nullable(),
  legacyRef: optionalText,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreatePatientBody = z.infer<typeof createPatientBody>;

export type CreatePatientInput = {
  fullName: string;
  gender: PatientGender;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  mobile: string | null;
  noMobileReason: string | null;
  mobileSecondary: string | null;
  area: string | null;
  email: string | null;
  referralSourceId: string | null;
  referredBy: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyMobile: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  messageLanguage: (typeof PATIENT_MESSAGE_LANGUAGES)[number] | null;
  legacyRef: string | null;
  notes: string | null;
};

export function parseCreatePatient(
  body: unknown,
  onDate: string,
): { ok: true; value: CreatePatientInput } | { ok: false; message: string } {
  const parsed = createPatientBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const d = parsed.data;
  const dateOfBirth = d.dateOfBirth ?? null;
  const ageYearsAtReg = d.ageYearsAtReg ?? null;
  if (!dateOfBirth && ageYearsAtReg === null) {
    return { ok: false, message: "Enter the date of birth, or the age in years." };
  }

  const mobileRaw = d.mobile?.trim() || null;
  const noMobileReason = d.noMobileReason;
  const mobile = mobileRaw ? normaliseMobile(mobileRaw) : null;
  if (mobileRaw && !mobile) {
    return { ok: false, message: "Enter a valid mobile number, or leave it blank." };
  }
  if (mobile && noMobileReason) {
    return { ok: false, message: "Clear the 'no mobile' reason when a mobile is entered." };
  }
  if (!mobile && !noMobileReason) {
    return {
      ok: false,
      message: "Enter a mobile number, or say why there is no mobile.",
    };
  }

  const secondaryRaw = d.mobileSecondary?.trim() || null;
  const mobileSecondary = secondaryRaw ? normaliseMobile(secondaryRaw) : null;
  if (secondaryRaw && !mobileSecondary) {
    return { ok: false, message: "Enter a valid other mobile, or leave it blank." };
  }

  const emergencyRaw = d.emergencyMobile?.trim() || null;
  const emergencyMobile = emergencyRaw ? normaliseMobile(emergencyRaw) : null;
  if (emergencyRaw && !emergencyMobile) {
    return { ok: false, message: "Enter a valid emergency mobile, or leave it blank." };
  }

  const guardian = normalisedGuardian({
    guardianName: d.guardianName ?? null,
    guardianRelation: d.guardianRelation ?? null,
    guardianMobile: d.guardianMobile ?? null,
  });
  const guardianErr = guardianSaveError(
    {
      dateOfBirth,
      ageYearsAtReg,
      registeredOn: onDate,
      ...guardian,
    },
    onDate,
  );
  if (guardianErr) return { ok: false, message: guardianErr };

  return {
    ok: true,
    value: {
      fullName: d.fullName,
      gender: d.gender,
      dateOfBirth,
      ageYearsAtReg,
      mobile,
      noMobileReason,
      mobileSecondary,
      area: d.area,
      email: d.email,
      referralSourceId: d.referralSourceId,
      referredBy: d.referredBy,
      emergencyName: d.emergencyName,
      emergencyRelation: d.emergencyRelation,
      emergencyMobile,
      guardianName: guardian.guardianName,
      guardianRelation: guardian.guardianRelation,
      guardianMobile: guardian.guardianMobile,
      messageLanguage: d.messageLanguage ?? null,
      legacyRef: d.legacyRef,
      notes: d.notes,
    },
  };
}
