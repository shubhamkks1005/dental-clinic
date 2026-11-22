// 2.2.8: one contact mobile for reminders/OTP (Phase 8), plus who owns that number.

export const CONTACT_RELATIONS = [
  "self",
  "mother",
  "father",
  "spouse",
  "guardian",
  "other",
] as const;
export type ContactRelation = (typeof CONTACT_RELATIONS)[number];

export type ContactSource = {
  mobile: string | null;
  guardianMobile: string | null;
  contactRelation: ContactRelation | null;
};

/** Prefer the patient's own mobile; else guardian mobile (child / no-phone adult). */
export function contactMobile(source: {
  mobile: string | null;
  guardianMobile: string | null;
}): string | null {
  return source.mobile ?? source.guardianMobile;
}

/** Plain sentence when a contact number exists but the owner relation is missing. */
export function contactRelationSaveError(source: ContactSource): string | null {
  if (!contactMobile(source)) return null;
  if (source.contactRelation && CONTACT_RELATIONS.includes(source.contactRelation)) return null;
  return "Say whose mobile this is (self, mother, father, spouse, guardian or other).";
}

export function defaultContactRelation(source: {
  mobile: string | null;
  guardianMobile: string | null;
}): ContactRelation | null {
  if (source.mobile) return "self";
  if (source.guardianMobile) return "guardian";
  return null;
}
