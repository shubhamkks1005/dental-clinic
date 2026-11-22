import { z } from "zod";
import { chartViewSchema } from "./chart-view";
import { consentTemplatesSchema } from "./consent-templates";
import type { Parsed } from "./staff";
import { holidaysSchema, timingsSchema } from "./timings";

// 1.5.1: every setting the app knows, with its rule. A value that breaks the rule is never
// saved. New settings (timings 1.5.3, lists 1.5.4, clinic details 1.5.2) add a line here and a
// seed migration with the default.
export const SETTING_SCHEMAS = {
  "patient_code.prefix": z
    .string({ error: "Enter the prefix as text." })
    .trim()
    .regex(/^[A-Z0-9-]{1,5}$/, "Use 1 to 5 capital letters, digits or dashes, for example P-."),
  "patient_code.digits": z
    .number({ error: "Enter a number." })
    .int("Use a whole number.")
    .min(4, "Use at least 4 digits.")
    .max(8, "Use at most 8 digits."),
  "clinic.name": z
    .string({ error: "Enter the clinic name." })
    .trim()
    .min(1, "Enter the clinic name.")
    .max(80, "The clinic name is too long."),
  // Storage key of the uploaded logo (1.5.2); null = the placeholder tooth mark.
  "clinic.logo": z.string({ error: "The logo value is not valid." }).max(300).nullable(),
  // 1.5.3: weekly hours, slot length, chairs; and the list of holidays.
  "clinic.timings": timingsSchema,
  "clinic.holidays": holidaysSchema,
  // 2.2.7: registration notice; version stored on each consent row.
  "privacy_notice.version": z
    .number({ error: "Enter a whole number." })
    .int("Use a whole number.")
    .min(1, "Notice version must be at least 1."),
  "privacy_notice.body": z
    .string({ error: "Enter the notice text." })
    .trim()
    .min(1, "Enter the notice text.")
    .max(20000, "The notice is too long."),
  // 2.3.5: how far ahead a normal booking may go (override with reason still allowed).
  "appointments.book_ahead_days": z
    .number({ error: "Enter a whole number." })
    .int("Use a whole number.")
    .min(1, "Use at least 1 day.")
    .max(365, "Use at most 365 days."),
  // 3.3.4: ask "Any change in medical history?" when last review is older than this.
  "medical_history.stale_months": z
    .number({ error: "Enter a whole number." })
    .int("Use a whole number.")
    .min(1, "Use at least 1 month.")
    .max(36, "Use at most 36 months."),
  // 3.4.3: facing + display notation in one setting (storage always FDI).
  "chart.view": chartViewSchema,
  // 3.8.1: treatment consent templates (English; DRAFT until lawyer/sister confirm).
  "consent.templates": consentTemplatesSchema,
  // 4.3.2 letterhead (clinic profile; 1.5.2 deferred pieces live here for print).
  "clinic.address": z
    .string({ error: "Enter the clinic address." })
    .trim()
    .min(1, "Enter the clinic address.")
    .max(200),
  "clinic.phone": z
    .string({ error: "Enter the clinic phone." })
    .trim()
    .min(1, "Enter the clinic phone.")
    .max(40),
  "clinic.tagline": z.string().trim().max(80).optional().default(""),
  "doctor.name": z
    .string({ error: "Enter the doctor's name." })
    .trim()
    .min(1, "Enter the doctor's name.")
    .max(80),
  "doctor.qualifications": z.string().trim().max(120).optional().default(""),
  "doctor.speciality": z.string().trim().max(80).optional().default(""),
  "doctor.registration_no": z.string().trim().max(40).optional().default(""),
  // 4.5.4: doctor acknowledged the medicines list version.
  "medicines.list_reviewed": z
    .object({
      at: z.string().min(1),
      byUserId: z.string().min(1),
      byName: z.string().min(1),
      note: z.string().max(200).optional().default(""),
    })
    .nullable(),
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;

export const SETTING_KEYS = Object.keys(SETTING_SCHEMAS) as SettingKey[];

export const isSettingKey = (key: string): key is SettingKey => Object.hasOwn(SETTING_SCHEMAS, key);

// Returns the cleaned value (for example trimmed text) or the first plain-English problem.
export function parseSettingValue(key: SettingKey, value: unknown): Parsed<unknown> {
  const result = SETTING_SCHEMAS[key].safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, message: result.error.issues[0]?.message ?? "This value is not allowed." };
}
