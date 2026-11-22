import { z } from "zod";

export const CONSENT_TEMPLATE_KEYS = [
  "extraction",
  "rct",
  "implant",
  "whitening",
  "anaesthesia",
  "photo_xray",
] as const;
export type ConsentTemplateKey = (typeof CONSENT_TEMPLATE_KEYS)[number];

const templateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(20000),
  version: z.number().int().min(1),
});

export const consentTemplatesSchema = z.object({
  extraction: templateSchema,
  rct: templateSchema,
  implant: templateSchema,
  whitening: templateSchema,
  anaesthesia: templateSchema,
  photo_xray: templateSchema,
});

export type ConsentTemplates = z.infer<typeof consentTemplatesSchema>;

/** Procedures that soft-warn when treatment consent is missing (3.8.2). */
export const CONSENT_WARN_PROCEDURE_LABELS = ["extraction", "extract"] as const;

export function procedureNeedsConsentWarning(label: string): boolean {
  const n = label.trim().toLowerCase();
  return CONSENT_WARN_PROCEDURE_LABELS.some((k) => n.includes(k));
}

export const DRAFT_CONSENT_TEMPLATES: ConsentTemplates = {
  extraction: {
    title: "Tooth extraction",
    version: 1,
    body: "DRAFT - lawyer to confirm. I understand a tooth may be removed, with risks including pain, bleeding, swelling, dry socket, and injury to nearby teeth or nerves. Alternatives and aftercare were explained.",
  },
  rct: {
    title: "Root canal treatment",
    version: 1,
    body: "DRAFT - lawyer to confirm. I understand root canal treatment may be needed, with risks including incomplete healing, need for retreatment or extraction, and temporary discomfort. Alternatives were explained.",
  },
  implant: {
    title: "Dental implant",
    version: 1,
    body: "DRAFT - lawyer to confirm. I understand implant treatment, healing time, and risks including infection, implant failure, and need for further surgery. Cost and alternatives were explained.",
  },
  whitening: {
    title: "Teeth whitening",
    version: 1,
    body: "DRAFT - lawyer to confirm. I understand whitening may cause temporary sensitivity and results vary. It is not permanent. Alternatives were explained.",
  },
  anaesthesia: {
    title: "Local anaesthesia",
    version: 1,
    body: "DRAFT - lawyer to confirm. I understand local anaesthetic may be used, with uncommon risks including prolonged numbness, allergy, or heartbeat changes. I will tell the dentist about medicines and allergies.",
  },
  photo_xray: {
    title: "Photos and X-rays",
    version: 1,
    body: "DRAFT - lawyer to confirm. I agree that clinical photos and X-rays may be taken for diagnosis and treatment records. Separate marketing use needs a separate consent.",
  },
};
