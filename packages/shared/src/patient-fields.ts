// 2.1.1: the patient record fields. Required vs optional and why live here — one place for
// forms, API and the schema. Clinical/legal wording for minors is finalized in 2.1.3.

export const PATIENT_GENDERS = ["female", "male", "other"] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export const PATIENT_STATUSES = ["active", "archived"] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

// SMS language preference (OPEN in DECISIONS.md). Stored so Phase 7 can use it; UI may stay English-only.
export const PATIENT_MESSAGE_LANGUAGES = ["english", "hinglish"] as const;
export type PatientMessageLanguage = (typeof PATIENT_MESSAGE_LANGUAGES)[number];

export type PatientFieldKey =
  | "code"
  | "full_name"
  | "gender"
  | "date_of_birth"
  | "age_years_at_reg"
  | "mobile"
  | "no_mobile_reason"
  | "mobile_secondary"
  | "area"
  | "email"
  | "referral_source_id"
  | "referred_by"
  | "emergency_name"
  | "emergency_relation"
  | "emergency_mobile"
  | "guardian_name"
  | "guardian_relation"
  | "guardian_mobile"
  | "message_language"
  | "legacy_ref"
  | "notes"
  | "status";

export type PatientFieldDef = {
  key: PatientFieldKey;
  label: string;
  required: boolean;
  /** Why the field exists (or why it is optional). */
  purpose: string;
};

/** The ordered field list for the patient record (plan 2.1.1 Done when). */
export const PATIENT_FIELDS: readonly PatientFieldDef[] = [
  {
    key: "code",
    label: "Patient no.",
    required: true,
    purpose: "Clinic quote number (P-000123). Assigned on save from counters; never edited.",
  },
  {
    key: "full_name",
    label: "Full name",
    required: true,
    purpose: "How staff call the patient; shown on every screen and print.",
  },
  {
    key: "gender",
    label: "Gender",
    required: true,
    purpose: "Needed for forms and some certificates; three plain choices only.",
  },
  {
    key: "date_of_birth",
    label: "Date of birth",
    required: false,
    purpose: "Best way to show age later. Prefer this over age alone when the patient knows it.",
  },
  {
    key: "age_years_at_reg",
    label: "Age at registration",
    required: false,
    purpose:
      "When DOB is unknown. Stored with registration day so displayed age stays correct (2.1.4).",
  },
  {
    key: "mobile",
    label: "Mobile",
    required: false,
    purpose: "Main contact for reminders. Required unless no_mobile_reason is set.",
  },
  {
    key: "no_mobile_reason",
    label: "Why there is no mobile",
    required: false,
    purpose:
      "Allows save without a mobile (shared phone, child, refused). Required if mobile is empty.",
  },
  {
    key: "mobile_secondary",
    label: "Other mobile",
    required: false,
    purpose: "Second number (spouse, parent). Optional.",
  },
  {
    key: "area",
    label: "Area or address",
    required: false,
    purpose: "Rough location for phone booking; not a full legal address.",
  },
  {
    key: "email",
    label: "Email",
    required: false,
    purpose: "Only for patients who give one; used later for email receipts if enabled.",
  },
  {
    key: "referral_source_id",
    label: "Referral source",
    required: false,
    purpose: "How they heard of the clinic (editable list from Settings).",
  },
  {
    key: "referred_by",
    label: "Referred by",
    required: false,
    purpose: "Free text name when a person (not a channel) sent them.",
  },
  {
    key: "emergency_name",
    label: "Emergency contact name",
    required: false,
    purpose: "Who to call in an emergency (any age). Separate from guardian for minors.",
  },
  {
    key: "emergency_relation",
    label: "Emergency contact relation",
    required: false,
    purpose: "Relation to the patient (optional).",
  },
  {
    key: "emergency_mobile",
    label: "Emergency contact mobile",
    required: false,
    purpose: "Mobile for the emergency contact.",
  },
  {
    key: "guardian_name",
    label: "Guardian name",
    required: false,
    purpose: "Required when the patient is under 18 (2.1.3). Final DPDP wording waits on a lawyer.",
  },
  {
    key: "guardian_relation",
    label: "Guardian relation",
    required: false,
    purpose: "How the guardian is related (mother, father, …). Required with guardian name.",
  },
  {
    key: "guardian_mobile",
    label: "Guardian mobile",
    required: false,
    purpose: "Guardian contact number. Required with guardian name; uses the shared mobile rule.",
  },
  {
    key: "message_language",
    label: "SMS language",
    required: false,
    purpose: "Preference for patient SMS (English or Hinglish). Clinic still to confirm default.",
  },
  {
    key: "legacy_ref",
    label: "Old register no.",
    required: false,
    purpose: "Number from the paper register during pilot; search and never reuse as patient no.",
  },
  {
    key: "notes",
    label: "Non-clinical notes",
    required: false,
    purpose: "Reception notes only (e.g. prefers mornings). Not diagnosis or chart.",
  },
  {
    key: "status",
    label: "Status",
    required: true,
    purpose: "active in daily search; archived hidden until restored (2.1.8).",
  },
];

/** The four values that must be present to save a new patient (plan 2.1.1). */
export const PATIENT_SAVE_REQUIRED: readonly PatientFieldKey[] = [
  "full_name",
  "gender",
  "age_years_at_reg", // or date_of_birth — enforced together in validation (2.1.4)
  "mobile", // or no_mobile_reason
];
