import { describe, expect, it } from "vitest";
import { CERTIFICATE_DRAFT_BANNER, parseCreateCertificate } from "./certificates";

describe("certificates (4.4.3)", () => {
  it("banner is marked for doctor and lawyer", () => {
    expect(CERTIFICATE_DRAFT_BANNER).toContain("DRAFT - doctor to confirm");
    expect(CERTIFICATE_DRAFT_BANNER).toContain("DRAFT - lawyer to confirm");
  });

  it("rejects empty identification mark", () => {
    const bad = parseCreateCertificate({
      patientId: "p1",
      patientName: "Fake Patient",
      patientAge: "30 yrs",
      patientAddress: "Test Area",
      identificationMark: "  ",
      signMethod: "signature",
      reason: "Rest after treatment",
      fromOn: "2026-11-20",
      toOn: "2026-11-22",
    });
    expect(bad.ok).toBe(false);
  });

  it("accepts a minimal valid create body", () => {
    const ok = parseCreateCertificate({
      patientId: "p1",
      patientName: "Fake Patient",
      patientAge: "30 yrs",
      patientAddress: "",
      identificationMark: "Mole on left cheek",
      signMethod: "thumb",
      reason: "Rest after extraction",
      fromOn: "2026-11-20",
      toOn: "2026-11-22",
      diagnosis: null,
    });
    expect(ok.ok).toBe(true);
  });
});
