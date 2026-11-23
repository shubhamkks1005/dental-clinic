import { describe, expect, it } from "vitest";
import { patientStripFacts } from "./visit-patient-strip";

const base = {
  gender: "female" as const,
  dateOfBirth: "1990-05-10",
  ageYearsAtReg: null,
  createdAt: "2026-01-01T05:00:00.000Z",
  mobile: "+919800000001",
};

describe("patientStripFacts (visit screen)", () => {
  it("computes age from the date of birth, never from a stored age", () => {
    expect(patientStripFacts(base, "2026-11-23").ageGender).toBe("36 yrs · Female");
  });

  it("an age-only patient grows older with the years", () => {
    const p = { ...base, dateOfBirth: null, ageYearsAtReg: 30 };
    expect(patientStripFacts(p, "2027-02-01").ageGender).toBe("31 yrs · Female");
  });

  it("shows the mobile in the usual grouping, or says there is none", () => {
    expect(patientStripFacts(base, "2026-11-23").mobile).toBe("98000 00001");
    expect(patientStripFacts({ ...base, mobile: null }, "2026-11-23").mobile).toBe("No mobile");
  });
});
