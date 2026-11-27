import { z } from "zod";

/** 40 KB of picture is about 54,000 characters of base64 text. */
export const QR_MAX_CHARS = 54_600;
export const QR_SETTING_KEY = "clinic.qr_image";
import { chartViewSchema } from "./chart-view";
import { consentTemplatesSchema } from "./consent-templates";
import { messageTemplatesSchema, messagingSettingsSchema } from "./messaging";
import type { Parsed } from "./staff";
import { holidaysSchema, timingsSchema } from "./timings";
import { TUNABLES, type TunableKey } from "./tunables";

function intTunable(key: TunableKey) {
  const t = TUNABLES[key];
  return z
    .number({ error: "Enter a whole number." })
    .int("Use a whole number.")
    .min(t.min, `Use at least ${t.min}.`)
    .max(t.max, `Use at most ${t.max}.`);
}

// 1.5.1: every setting the app knows, with its rule. A value that breaks the rule is never
// saved. New settings (timings 1.5.3, lists 1.5.4, clinic details 1.5.2) add a line here and a
// seed migration with the default. Numeric clinic tunables (6.5.3) use TUNABLES for bounds.
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
  // 2.3.5 / 6.5.3: book ahead, no-show delay, undo window.
  "appointments.book_ahead_days": intTunable("appointments.book_ahead_days"),
  "appointments.no_show_after_minutes": intTunable("appointments.no_show_after_minutes"),
  "appointments.status_undo_hours": intTunable("appointments.status_undo_hours"),
  // 3.3.4 / 6.5.3: medical history review cadence.
  "appointments.late_after_minutes": intTunable("appointments.late_after_minutes"),
  "today.running_late_after_minutes": intTunable("today.running_late_after_minutes"),
  "medical_history.stale_months": intTunable("medical_history.stale_months"),
  "ui.auto_refresh_seconds": intTunable("ui.auto_refresh_seconds"),
  "files.storage_warn_gb": intTunable("files.storage_warn_gb"),
  "files.storage_crit_gb": intTunable("files.storage_crit_gb"),
  "outreach.incomplete_days": intTunable("outreach.incomplete_days"),
  "outreach.recall_min_months": intTunable("outreach.recall_min_months"),
  "outreach.recall_max_months": intTunable("outreach.recall_max_months"),
  "records.demand_hours": intTunable("records.demand_hours"),
  "billing.consultation_fee_paise": intTunable("billing.consultation_fee_paise"),
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
  // Letterhead lines (owner's paper): kind of clinic under the tagline, contact lines, doctor's extra line.
  "clinic.kind": z.string().trim().max(60).optional().default(""),
  "clinic.email": z.string().trim().max(80).optional().default(""),
  "clinic.instagram": z.string().trim().max(60).optional().default(""),
  "doctor.extra_line": z.string().trim().max(120).optional().default(""),
  "doctor.name": z
    .string({ error: "Enter the doctor's name." })
    .trim()
    .min(1, "Enter the doctor's name.")
    .max(80),
  "doctor.qualifications": z.string().trim().max(120).optional().default(""),
  "doctor.speciality": z.string().trim().max(80).optional().default(""),
  "doctor.registration_no": z.string().trim().max(40).optional().default(""),
  // 4.5.4: doctor acknowledged the medicines list (itemCount = version at review).
  "medicines.list_reviewed": z
    .object({
      at: z.string().min(1),
      byUserId: z.string().min(1),
      byName: z.string().min(1),
      itemCount: z.number().int().min(0),
      note: z.string().max(200).optional().default(""),
    })
    .nullable(),
  // 5.1.2: true = SB-/SR-/SF- so software numbers do not collide with paper books.
  "billing.shadow_series": z.boolean(),
  // 5.2.6: DRAFT - accountant to confirm. Default off = no tax on bills.
  "billing.gst_mode": z.enum(["off", "on"]),
  // Visit finished (owner 2026-11-27): the invoice is made after the visit (doctor) or at arrival (desk).
  "billing.invoice_timing": z.enum(["after_visit", "at_arrival"]),
  // 7.4.1 / 7.4.3 messaging (Phase 7). Templates DRAFT until doctor confirms.
  "messaging.settings": messagingSettingsSchema,
  "messaging.templates": messageTemplatesSchema,
  // The doctor's QR picture for the prescription (PNG or JPEG as a data URL, at most 40 KB). It is read
  // on its own (GET /settings/clinic.qr_image) and left out of the list of all settings: it is big.
  "clinic.qr_image": z
    .string({ error: "The QR picture is not valid." })
    .max(QR_MAX_CHARS, "The QR picture is too big. Use one under 40 KB.")
    .regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/, "Use a PNG or JPEG picture.")
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
