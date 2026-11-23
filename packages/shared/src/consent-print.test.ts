import { describe, expect, it } from "vitest";
import { DRAFT_CONSENT_TEMPLATES } from "./consent-templates";
import { consentPrintDocumentId, parseConsentTemplateKey } from "./consent-print";

describe("consent print (4.4.2)", () => {
  it("English drafts still say DRAFT for the lawyer", () => {
    expect(DRAFT_CONSENT_TEMPLATES.implant.body).toContain("DRAFT - lawyer to confirm");
  });

  it("builds stable print document ids", () => {
    expect(consentPrintDocumentId("p1", "extraction")).toBe("p1:extraction");
    expect(parseConsentTemplateKey("extraction")).toBe("extraction");
    expect(parseConsentTemplateKey("nope")).toBeNull();
  });
});
