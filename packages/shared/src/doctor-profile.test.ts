import { describe, expect, it } from "vitest";
import { doctorProfileSchema, saveDoctorProfileSchema } from "./doctor-profile";

describe("doctor profile (owner 2026-11-26: own letterhead per doctor)", () => {
  it("needs a name; other lines are optional and trimmed", () => {
    const r = doctorProfileSchema.safeParse({ nameOnRx: "  Dr. Fake Asha " });
    expect(r.success && r.data).toEqual({
      nameOnRx: "Dr. Fake Asha",
      qualifications: "",
      speciality: "",
      registrationNo: "",
      extraLine: "",
    });
    expect(doctorProfileSchema.safeParse({ nameOnRx: " " }).success).toBe(false);
  });

  it("keeps the old settings limits", () => {
    expect(doctorProfileSchema.safeParse({ nameOnRx: "x".repeat(81) }).success).toBe(false);
    expect(
      doctorProfileSchema.safeParse({ nameOnRx: "Dr A", registrationNo: "x".repeat(41) }).success,
    ).toBe(false);
  });

  it("save needs a version (0 for the first save)", () => {
    expect(saveDoctorProfileSchema.safeParse({ nameOnRx: "Dr A", version: 0 }).success).toBe(true);
    expect(saveDoctorProfileSchema.safeParse({ nameOnRx: "Dr A" }).success).toBe(false);
  });
});
