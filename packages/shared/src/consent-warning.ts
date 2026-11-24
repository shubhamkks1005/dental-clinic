// Kept apart from consent-templates.ts on purpose: that file pulls in the Hindi consent forms
// (~46 KB), and the finalise warning must not drag them into the first page load (S3.1.4).

/** Procedures that soft-warn when treatment consent is missing (3.8.2). */
export const CONSENT_WARN_PROCEDURE_LABELS = ["extraction", "extract"] as const;

export function procedureNeedsConsentWarning(label: string): boolean {
  const n = label.trim().toLowerCase();
  return CONSENT_WARN_PROCEDURE_LABELS.some((k) => n.includes(k));
}
