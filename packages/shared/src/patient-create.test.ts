import { describe, expect, it } from "vitest";
import { parseCreatePatient } from "./patient-create";

const day = "2026-11-22";

function base(over: Record<string, unknown> = {}) {
  return {
    fullName: "Fake New Patient",
    gender: "female",
    ageYearsAtReg: 30,
    mobile: "9000000001",
    ...over,
  };
}

describe("parseCreatePatient (2.2.1)", () => {
  it("accepts the four required fields and normalises mobile", () => {
    const r = parseCreatePatient(base(), day);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.mobile).toBe("+919000000001");
    expect(r.value.fullName).toBe("Fake New Patient");
  });

  it("rejects missing age and DOB", () => {
    const r = parseCreatePatient(base({ ageYearsAtReg: null, dateOfBirth: null }), day);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(/date of birth|age/i);
  });

  it("rejects missing mobile without a reason", () => {
    const r = parseCreatePatient(base({ mobile: null }), day);
    expect(r.ok).toBe(false);
  });

  it("allows no mobile when a reason is given", () => {
    const r = parseCreatePatient(
      base({ mobile: null, noMobileReason: "Child — uses guardian" }),
      day,
    );
    expect(r.ok).toBe(true);
  });

  it("blocks under-18 without guardian", () => {
    const r = parseCreatePatient(base({ ageYearsAtReg: 10 }), day);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(/guardian/i);
  });

  it("accepts under-18 with guardian", () => {
    const r = parseCreatePatient(
      base({
        ageYearsAtReg: 10,
        guardianName: "Fake Parent",
        guardianRelation: "Mother",
        guardianMobile: "9000000099",
      }),
      day,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guardianMobile).toBe("+919000000099");
  });
});
