// 2.1.9 consent types. Notice body lives in versioned settings (2.2.7); we store notice_version here.
// 3.8.2: treatment rows may link visit/plan/template.

export const CONSENT_TYPES = [
  "privacy_notice",
  "sms_reminders",
  "marketing",
  "treatment",
  "photo",
  "portal",
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_METHODS = ["paper", "verbal", "form", "portal"] as const;
export type ConsentMethod = (typeof CONSENT_METHODS)[number];

export type ConsentRow = {
  id: string;
  patientId: string;
  type: ConsentType;
  noticeVersion: number;
  given: boolean;
  givenAt: string;
  recordedBy: string;
  recordedByName: string | null;
  method: ConsentMethod;
  createdAt: string;
  visitId: string | null;
  planItemId: string | null;
  templateKey: string | null;
  templateVersion: number | null;
  explainedBy: string | null;
};

/** Latest given (not withdrawn) of a type wins. */
export function hasActiveConsent(rows: ConsentRow[], type: ConsentType): boolean {
  const ofType = rows.filter((r) => r.type === type);
  if (ofType.length === 0) return false;
  // list is newest-first from API; first match is latest.
  return ofType[0]!.given;
}
