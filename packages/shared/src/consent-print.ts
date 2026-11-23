import { CONSENT_TEMPLATE_KEYS, type ConsentTemplateKey } from "./consent-templates";

/** print_log documentId for a filled consent form (4.4.2). */
export function consentPrintDocumentId(patientId: string, templateKey: ConsentTemplateKey): string {
  return `${patientId}:${templateKey}`;
}

export function parseConsentTemplateKey(raw: string | null | undefined): ConsentTemplateKey | null {
  if (!raw) return null;
  return (CONSENT_TEMPLATE_KEYS as readonly string[]).includes(raw)
    ? (raw as ConsentTemplateKey)
    : null;
}
