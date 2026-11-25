import { SETTING_KEYS, type SettingKey } from "./settings";
import { TUNABLES, type TunableKey } from "./tunables";

/** 6.5.6: one English line per setting — what it does, example, what changes. */
export const SETTING_HELP: Record<SettingKey, string> = {
  "patient_code.prefix":
    "Letters before the patient number. Example: P-. Changing this only affects new patients.",
  "patient_code.digits":
    "How many digits in the patient number. Example: 6 → P-000123. Only new patients change.",
  "clinic.name":
    "Clinic name on prescriptions, bills and the sign-in page. Example: Align Dentistry.",
  "clinic.logo":
    "Storage key for the uploaded logo. Leave empty to use the tooth mark. Upload comes later.",
  "clinic.qr_image":
    "Your QR picture (PNG or JPEG, under 40 KB). It is printed on the prescription. Leave empty for none.",
  "clinic.timings":
    "Weekly hours, lunch, slot length and chairs. Example: Mon–Sat 10:00–19:00. Booking uses these at once.",
  "clinic.holidays":
    "Closed dates. Yearly ones repeat every year. Booking offers no slots on these days.",
  "privacy_notice.version":
    "Version stamped on each consent. Bump when you change the notice text. Example: 2.",
  "privacy_notice.body":
    "Text shown at registration. Example: a short privacy notice. Patients see the new text after save.",
  "appointments.book_ahead_days": TUNABLES["appointments.book_ahead_days"].help,
  "appointments.no_show_after_minutes": TUNABLES["appointments.no_show_after_minutes"].help,
  "appointments.status_undo_hours": TUNABLES["appointments.status_undo_hours"].help,
  "appointments.late_after_minutes": TUNABLES["appointments.late_after_minutes"].help,
  "today.running_late_after_minutes": TUNABLES["today.running_late_after_minutes"].help,
  "medical_history.stale_months": TUNABLES["medical_history.stale_months"].help,
  "ui.auto_refresh_seconds": TUNABLES["ui.auto_refresh_seconds"].help,
  "files.storage_warn_gb": TUNABLES["files.storage_warn_gb"].help,
  "files.storage_crit_gb": TUNABLES["files.storage_crit_gb"].help,
  "outreach.incomplete_days": TUNABLES["outreach.incomplete_days"].help,
  "outreach.recall_min_months": TUNABLES["outreach.recall_min_months"].help,
  "outreach.recall_max_months": TUNABLES["outreach.recall_max_months"].help,
  "records.demand_hours": TUNABLES["records.demand_hours"].help,
  "billing.consultation_fee_paise": TUNABLES["billing.consultation_fee_paise"].help,
  "chart.view":
    "Chart facing and tooth labels (FDI / Universal / Palmer). Example: dentist + FDI. New charts use it at once.",
  "consent.templates":
    "DRAFT consent wording for treatments. Example: extraction template. Prints use the saved text.",
  "clinic.address":
    "Address on letterhead. Example: a street in Jhansi. Shows on printed docs after save.",
  "clinic.phone": "Clinic phone on letterhead and messages. Example: a 10-digit number.",
  "clinic.tagline": "Short line under the clinic name. Example: Family dental care. Optional.",
  "clinic.kind": "Line under the tagline. Example: Orthodontic and Dental Clinic. Optional.",
  "clinic.email": "Clinic email on letterhead. Optional.",
  "clinic.instagram": "Instagram name in the letterhead footer. Optional.",
  "doctor.extra_line":
    "One more line under the speciality. Example: Former Senior Lecturer, a college name. Optional.",
  "doctor.name": "Doctor name on prescriptions and certificates. Example: Dr. Nidhi Kushwaha.",
  "doctor.qualifications": "Degrees under the doctor name. Example: BDS, MDS. Optional.",
  "doctor.speciality": "Speciality line on letterhead. Example: Orthodontist. Optional.",
  "doctor.registration_no":
    "Council registration number. Required before Rx or certificate print. Example: a state number.",
  "medicines.list_reviewed":
    "Record that the doctor reviewed the medicines list. Saving stamps who and when.",
  "billing.shadow_series":
    "When on, bill numbers use SB-/SR-/SF- so they do not collide with paper books.",
  "billing.gst_mode":
    "DRAFT — accountant to confirm. Off = no tax on bills. On = tax lines when ready.",
  "messaging.settings":
    "Reminder switches, quiet hours, daily cap and WhatsApp options. Example: remind at 17:00. Changes apply to new planned messages.",
  "messaging.templates":
    "English WhatsApp/SMS wording. Marked DRAFT until the doctor confirms. Preview with fake names before save.",
};

export function settingHelp(key: SettingKey): string {
  return SETTING_HELP[key];
}

/** True when every known setting (and every tunable) has non-empty help. */
export function allSettingsHaveHelp(): boolean {
  return SETTING_KEYS.every((k) => SETTING_HELP[k].trim().length > 0);
}

export function tunableHelp(key: TunableKey): string {
  return TUNABLES[key].help;
}
