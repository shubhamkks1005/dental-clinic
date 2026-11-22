import { describe, expect, it } from "vitest";
import { guardianSaveError } from "./patient-guardian";

const day = "2026-11-22";

function child(overrides: Record<string, unknown> = {}) {
  return {
    dateOfBirth: null as string | null,
    ageYearsAtReg: 10,
    registeredOn: day,
    guardianName: null as string | null,
    guardianRelation: null as string | null,
    guardianMobile: null as string | null,
    ...overrides,
  };
}

describe("guardianSaveError (2.1.3)", () => {
  it("blocks a 10-year-old without guardian name, relation or mobile", () => {
    expect(guardianSaveError(child(), day)).toMatch(/guardian's name/i);
    expect(guardianSaveError(child({ guardianName: "Fake Parent" }), day)).toMatch(/related/i);
    expect(
      guardianSaveError(child({ guardianName: "Fake Parent", guardianRelation: "Mother" }), day),
    ).toMatch(/mobile/i);
    expect(
      guardianSaveError(
        child({
          guardianName: "Fake Parent",
          guardianRelation: "Mother",
          guardianMobile: "5111111111",
        }),
        day,
      ),
    ).toMatch(/mobile/i);
  });

  it("allows a 10-year-old when guardian name, relation and mobile are present", () => {
    expect(
      guardianSaveError(
        child({
          guardianName: "Fake Parent",
          guardianRelation: "Mother",
          guardianMobile: "9876543210",
        }),
        day,
      ),
    ).toBeNull();
  });

  it("does not require a guardian for an 18-year-old", () => {
    expect(guardianSaveError(child({ ageYearsAtReg: 18 }), day)).toBeNull();
  });

  it("uses DOB when present (still under 18)", () => {
    expect(
      guardianSaveError(child({ dateOfBirth: "2016-11-22", ageYearsAtReg: null }), day),
    ).toMatch(/guardian/i);
  });
});
