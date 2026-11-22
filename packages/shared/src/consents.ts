// 2.1.9 consent types. Notice body lives in versioned settings (2.2.7); we store notice_version here.

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
};
