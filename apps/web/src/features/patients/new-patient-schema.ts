import {
  CONTACT_RELATIONS,
  displayDateField,
  formatDisplayDate,
  PATIENT_GENDERS,
  personNameField,
} from "@clinic/shared";
import { z } from "zod";
import type { PatientDetail } from "./api";

// Client form shape for S03/S16. Server re-validates via parseCreatePatient.

const blankToNull = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const newPatientSchema = z
  .object({
    fullName: personNameField,
    // D3: no default; the desk must choose.
    gender: z.enum(PATIENT_GENDERS, { message: "Choose female, male or other." }),
    birthDate: z.string().optional(),
    ageYears: z.string().optional(),
    mobile: z.string().optional(),
    noMobile: z.boolean(),
    noMobileReason: blankToNull,
    mobileSecondary: blankToNull,
    area: blankToNull,
    email: blankToNull,
    referredBy: blankToNull,
    emergencyName: blankToNull,
    emergencyRelation: blankToNull,
    emergencyMobile: blankToNull,
    guardianName: blankToNull,
    guardianRelation: blankToNull,
    guardianMobile: blankToNull,
    contactRelation: z.enum(CONTACT_RELATIONS).optional().nullable(),
    legacyRef: blankToNull,
    notes: blankToNull,
    noticeShown: z.boolean(),
    smsReminders: z.boolean(),
    marketing: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const hasDob = Boolean(v.birthDate?.trim());
    const ageRaw = v.ageYears?.trim() ?? "";
    const hasAge = ageRaw.length > 0;
    if (!hasDob && !hasAge) {
      ctx.addIssue({
        code: "custom",
        path: ["ageYears"],
        message: "Enter the date of birth, or the age in years.",
      });
    }
    if (hasDob) {
      const r = displayDateField.safeParse(v.birthDate);
      if (!r.success) {
        ctx.addIssue({
          code: "custom",
          path: ["birthDate"],
          message: r.error.issues[0]?.message ?? "Enter the date as DD/MM/YYYY.",
        });
      }
    }
    if (hasAge) {
      const n = Number(ageRaw);
      if (!Number.isInteger(n) || n < 0 || n > 120) {
        ctx.addIssue({
          code: "custom",
          path: ["ageYears"],
          message: "Enter age as a whole number from 0 to 120.",
        });
      }
    }
    if (!v.noMobile && !v.mobile?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["mobile"],
        message: "Enter a mobile number, or tick 'No mobile'.",
      });
    }
    if (v.noMobile && !v.noMobileReason) {
      ctx.addIssue({
        code: "custom",
        path: ["noMobileReason"],
        message: "Say why there is no mobile.",
      });
    }
  });

export type NewPatientFormValues = z.input<typeof newPatientSchema>;
export type NewPatientParsed = z.output<typeof newPatientSchema>;

export function toCreateBody(values: NewPatientParsed): Record<string, unknown> {
  const birth = values.birthDate?.trim() ? displayDateField.parse(values.birthDate) : null;
  const ageRaw = values.ageYears?.trim() ?? "";
  const ageYearsAtReg = ageRaw ? Number(ageRaw) : null;
  return {
    fullName: values.fullName,
    gender: values.gender,
    dateOfBirth: birth,
    ageYearsAtReg,
    mobile: values.noMobile ? null : values.mobile?.trim() || null,
    noMobileReason: values.noMobile ? values.noMobileReason : null,
    mobileSecondary: values.mobileSecondary,
    area: values.area,
    email: values.email,
    referredBy: values.referredBy,
    emergencyName: values.emergencyName,
    emergencyRelation: values.emergencyRelation,
    emergencyMobile: values.emergencyMobile,
    guardianName: values.guardianName,
    guardianRelation: values.guardianRelation,
    guardianMobile: values.guardianMobile,
    contactRelation: values.contactRelation ?? null,
    legacyRef: values.legacyRef,
    notes: values.notes,
    consents: {
      noticeShown: values.noticeShown,
      smsReminders: values.smsReminders,
      marketing: values.marketing,
    },
  };
}

export function toUpdateBody(values: NewPatientParsed, version: number): Record<string, unknown> {
  return { ...toCreateBody(values), version };
}

function mobileDigits(stored: string | null): string {
  return stored ? stored.replace(/^\+91/, "") : "";
}

export function defaultsFromPatient(p: PatientDetail): NewPatientFormValues {
  return {
    fullName: p.fullName,
    gender: p.gender,
    birthDate: p.dateOfBirth ? formatDisplayDate(p.dateOfBirth) : "",
    ageYears: p.ageYearsAtReg !== null ? String(p.ageYearsAtReg) : "",
    mobile: mobileDigits(p.mobile),
    noMobile: !p.mobile,
    noMobileReason: p.noMobileReason ?? "",
    mobileSecondary: mobileDigits(p.mobileSecondary),
    area: p.area ?? "",
    email: p.email ?? "",
    referredBy: p.referredBy ?? "",
    emergencyName: p.emergencyName ?? "",
    emergencyRelation: p.emergencyRelation ?? "",
    emergencyMobile: mobileDigits(p.emergencyMobile),
    guardianName: p.guardianName ?? "",
    guardianRelation: p.guardianRelation ?? "",
    guardianMobile: mobileDigits(p.guardianMobile),
    contactRelation: p.contactRelation ?? "self",
    legacyRef: p.legacyRef ?? "",
    notes: p.notes ?? "",
    noticeShown: false,
    smsReminders: false,
    marketing: false,
  };
}

export const NEW_PATIENT_DEFAULTS: NewPatientFormValues = {
  fullName: "",
  gender: "" as unknown as NewPatientFormValues["gender"],
  birthDate: "",
  ageYears: "",
  mobile: "",
  noMobile: false,
  noMobileReason: "",
  mobileSecondary: "",
  area: "",
  email: "",
  referredBy: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyMobile: "",
  guardianName: "",
  guardianRelation: "",
  guardianMobile: "",
  contactRelation: "self",
  legacyRef: "",
  notes: "",
  noticeShown: false,
  smsReminders: false,
  marketing: false,
};
