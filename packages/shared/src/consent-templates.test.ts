import { describe, expect, it } from "vitest";
import {
  DRAFT_CONSENT_TEMPLATES,
  consentTemplatesSchema,
  procedureNeedsConsentWarning,
} from "./consent-templates";
import { hasActiveConsent, type ConsentRow } from "./consents";

describe("consent templates (3.8.1)", () => {
  it("draft templates parse and mark DRAFT", () => {
    const parsed = consentTemplatesSchema.parse(DRAFT_CONSENT_TEMPLATES);
    expect(parsed.extraction.body).toContain("DRAFT - lawyer to confirm");
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
