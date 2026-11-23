import { describe, expect, it } from "vitest";
import { isNewPatientOn } from "./patient-new";

describe("isNewPatientOn (6.2.1)", () => {
  it("true when first_arrived_on matches and no legacy_ref", () => {
    expect(isNewPatientOn({ firstArrivedOn: "2026-11-23", legacyRef: null }, "2026-11-23")).toBe(
      true,
    );
  });

  it("false when import/legacy_ref set (paper register patient)", () => {
    expect(
      isNewPatientOn({ firstArrivedOn: "2026-11-23", legacyRef: "REG-42" }, "2026-11-23"),
    ).toBe(false);
  });

  it("false when first arrived on another day or never", () => {
    expect(isNewPatientOn({ firstArrivedOn: "2026-11-22", legacyRef: null }, "2026-11-23")).toBe(
      false,
    );
    expect(isNewPatientOn({ firstArrivedOn: null, legacyRef: null }, "2026-11-23")).toBe(false);
  });
});
