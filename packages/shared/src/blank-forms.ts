export const BLANK_FORM_KINDS = ["registration", "medical_history", "consent"] as const;
export type BlankFormKind = (typeof BLANK_FORM_KINDS)[number];

/** Default copies for downtime stack (4.4.6). */
export const BLANK_FORM_COPY_COUNT = 20;

export const BLANK_FORM_LABELS: Record<BlankFormKind, string> = {
  registration: "Patient registration",
  medical_history: "Medical history",
  consent: "Blank consent",
};

export function parseBlankFormKind(raw: string | null | undefined): BlankFormKind | null {
  if (!raw) return null;
  return (BLANK_FORM_KINDS as readonly string[]).includes(raw) ? (raw as BlankFormKind) : null;
}
