import { describe, expect, it } from "vitest";
import { parseConsentBody } from "./consent-body";
import {
  CONSENT_TEMPLATE_KEYS,
  CONSENT_TEMPLATE_META,
  DRAFT_CONSENT_TEMPLATES,
  consentTemplatesSchema,
  procedureNeedsConsentWarning,
  resolveConsentTemplates,
} from "./consent-templates";
import { hasActiveConsent, type ConsentRow } from "./consents";

describe("consent templates (3.8.1)", () => {
  it("default templates parse and the English drafts say DRAFT", () => {
    const parsed = consentTemplatesSchema.parse(DRAFT_CONSENT_TEMPLATES);
    expect(parsed.implant.body).toContain("DRAFT - lawyer to confirm");
  });

  it("every key has a title, a body that parses into blocks, and a language", () => {
    for (const key of CONSENT_TEMPLATE_KEYS) {
      const tpl = DRAFT_CONSENT_TEMPLATES[key];
      expect(tpl.title.length).toBeGreaterThan(0);
      expect(parseConsentBody(tpl.body).length).toBeGreaterThan(0);
      expect(CONSENT_TEMPLATE_META[key].lang).toMatch(/^(hi|en)$/);
      if (CONSENT_TEMPLATE_META[key].lang === "hi") expect(tpl.printTitle).toBeTruthy();
    }
  });

  it("the doctor's Hindi forms have no leftover clinic or signature lines", () => {
    for (const key of [
      "extraction",
      "filling",
      "rct",
      "scaling",
      "crown_bridge",
      "orthodontic",
    ] as const) {
      expect(DRAFT_CONSENT_TEMPLATES[key].body).not.toContain("हस्ताक्षर:");
      expect(DRAFT_CONSENT_TEMPLATES[key].body).not.toContain("क्लिनिक का नाम");
    }
  });

  it("resolve: old settings get the Hindi defaults and the new keys", () => {
    const old = {
      extraction: { title: "Tooth extraction", version: 1, body: "DRAFT - lawyer to confirm. old" },
      rct: { title: "Root canal treatment", version: 1, body: "DRAFT - lawyer to confirm. old" },
      implant: DRAFT_CONSENT_TEMPLATES.implant,
      whitening: DRAFT_CONSENT_TEMPLATES.whitening,
      anaesthesia: DRAFT_CONSENT_TEMPLATES.anaesthesia,
      photo_xray: DRAFT_CONSENT_TEMPLATES.photo_xray,
    };
    const out = resolveConsentTemplates(old);
    expect(out.extraction.printTitle).toBeTruthy();
    expect(out.filling.body).toContain("फिलिंग");
    expect(CONSENT_TEMPLATE_KEYS.every((k) => out[k])).toBe(true);
  });

  it("resolve: a template the doctor edited is kept", () => {
    const edited = { title: "Tooth extraction", version: 2, body: "My own wording" };
    const out = resolveConsentTemplates({ ...DRAFT_CONSENT_TEMPLATES, extraction: edited });
    expect(out.extraction.body).toBe("My own wording");
  });

  it("resolve: garbage falls back to all defaults", () => {
    expect(resolveConsentTemplates(null).rct.title).toBe(DRAFT_CONSENT_TEMPLATES.rct.title);
  });

  it("flags extraction procedures for soft warning", () => {
    expect(procedureNeedsConsentWarning("Extraction 46")).toBe(true);
    expect(procedureNeedsConsentWarning("Filling")).toBe(false);
  });
});

describe("hasActiveConsent (3.8.2)", () => {
  it("uses newest row for a type", () => {
    const rows = [
      {
        type: "photo",
        given: false,
      },
      {
        type: "photo",
        given: true,
      },
    ] as ConsentRow[];
    expect(hasActiveConsent(rows, "photo")).toBe(false);
  });
});
