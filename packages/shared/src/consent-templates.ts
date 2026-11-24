import { z } from "zod";
import { HI_FILLING, HI_EXTRACTION, HI_SCALING } from "./consent-forms-hi-a";
import { HI_CROWN_BRIDGE, HI_RCT } from "./consent-forms-hi-b";
import { HI_ORTHODONTIC } from "./consent-forms-hi-c";

// The doctor's six forms come first (Hindi), then the English drafts we still have no form for.
export const CONSENT_TEMPLATE_KEYS = [
  "extraction",
  "filling",
  "rct",
  "scaling",
  "crown_bridge",
  "orthodontic",
  "implant",
  "whitening",
  "anaesthesia",
  "photo_xray",
] as const;
export type ConsentTemplateKey = (typeof CONSENT_TEMPLATE_KEYS)[number];

const templateSchema = z.object({
  /** English name shown to staff in lists. */
  title: z.string().trim().min(1).max(120),
  /** Heading printed on the form (Hindi for the doctor's forms). Falls back to title. */
  printTitle: z.string().trim().max(160).optional(),
  body: z.string().trim().min(1).max(20000),
  version: z.number().int().min(1),
});

// The four newer keys are optional so settings saved before they existed still validate;
// resolveConsentTemplates() fills them from the defaults.
export const consentTemplatesSchema = z.object({
  extraction: templateSchema,
  rct: templateSchema,
  implant: templateSchema,
  whitening: templateSchema,
  anaesthesia: templateSchema,
  photo_xray: templateSchema,
  filling: templateSchema.optional(),
  scaling: templateSchema.optional(),
  crown_bridge: templateSchema.optional(),
  orthodontic: templateSchema.optional(),
});

export type ConsentTemplate = z.infer<typeof templateSchema>;
export type ConsentTemplates = Record<ConsentTemplateKey, ConsentTemplate>;

/** Print language and layout per form. Consent forms are Hindi only; all other text is English. */
export const CONSENT_TEMPLATE_META: Record<
  ConsentTemplateKey,
  { lang: "hi" | "en"; toothLine: boolean }
> = {
  extraction: { lang: "hi", toothLine: true },
  filling: { lang: "hi", toothLine: true },
  rct: { lang: "hi", toothLine: true },
  scaling: { lang: "hi", toothLine: false },
  crown_bridge: { lang: "hi", toothLine: true },
  orthodontic: { lang: "hi", toothLine: false },
  implant: { lang: "en", toothLine: true },
  whitening: { lang: "en", toothLine: false },
  anaesthesia: { lang: "en", toothLine: false },
  photo_xray: { lang: "en", toothLine: false },
};

export const DRAFT_CONSENT_TEMPLATES: ConsentTemplates = {
  extraction: HI_EXTRACTION,
  filling: HI_FILLING,
  rct: HI_RCT,
  scaling: HI_SCALING,
  crown_bridge: HI_CROWN_BRIDGE,
  orthodontic: HI_ORTHODONTIC,
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

// Settings saved before the Hindi forms still hold the old English DRAFT text at version 1.
// A template nobody edited (version 1, still the seeded DRAFT) is replaced by the current default;
// anything the doctor saved (version 2 or higher, or other text) is kept as is.
const SEEDED_DRAFT = "DRAFT - lawyer to confirm.";

export function resolveConsentTemplates(stored: unknown): ConsentTemplates {
  const parsed = consentTemplatesSchema.safeParse(stored);
  const saved: Partial<ConsentTemplates> = parsed.success ? parsed.data : {};
  const out = {} as ConsentTemplates;
  for (const key of CONSENT_TEMPLATE_KEYS) {
    const row = saved[key];
    const untouched = row === undefined || (row.version === 1 && row.body.startsWith(SEEDED_DRAFT));
    out[key] = untouched || row === undefined ? DRAFT_CONSENT_TEMPLATES[key] : row;
  }
  return out;
}
