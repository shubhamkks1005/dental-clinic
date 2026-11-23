import { describe, expect, it } from "vitest";
import { DRAFT_CONSENT_TEMPLATES } from "./consent-templates";
import { consentPrintDocumentId, parseConsentTemplateKey } from "./consent-print";

describe("consent print (4.4.2)", () => {
  it("extraction template is DRAFT for lawyer and one-page oriented", () => {
    const body = DRAFT_CONSENT_TEMPLATES.extraction.body;
    expect(body).toContain("DRAFT - lawyer to confirm");
    expect(body.length).toBeLessThan(800);
  });

  it("builds stable print document ids", () => {
    expect(consentPrintDocumentId("p1", "extraction")).toBe("p1:extraction");
    expect(parseConsentTemplateKey("extraction")).toBe("extraction");
    expect(parseConsentTemplateKey("nope")).toBeNull();
  });
});
