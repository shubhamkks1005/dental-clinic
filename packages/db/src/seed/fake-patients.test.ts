import { describe, expect, it } from "vitest";
import { generateFakePatients, seedPatientId } from "./fake-patients";

describe("generateFakePatients", () => {
  const patients = generateFakePatients();

  it("makes 5,000 patients by default", () => {
    expect(patients).toHaveLength(5000);
  });

  it("uses the P-000123 code format, unique, starting at P-000001", () => {
    expect(patients[0]?.code).toBe("P-000001");
    expect(patients.every((p) => /^P-\d{6}$/.test(p.code))).toBe(true);
    expect(new Set(patients.map((p) => p.code)).size).toBe(5000);
  });

  it("uses only the fake mobile range 9000000000-9000004999, unique, as +91…", () => {
    const mobiles = patients.map((p) => p.mobile);
    expect(mobiles.every((m) => /^90000\d{5}$/.test(m))).toBe(true);
    expect(new Set(mobiles).size).toBe(5000);
    expect(patients.every((p) => p.mobileE164 === `+91${p.mobile}`)).toBe(true);
  });

  it("always has a full name, gender and age at registration", () => {
    expect(
      patients.every(
        (p) =>
          p.fullName === `${p.firstName} ${p.lastName}` &&
          p.firstName.length > 0 &&
          p.lastName.length > 0 &&
          ["female", "male", "other"].includes(p.gender) &&
          p.ageYearsAtReg >= 5 &&
          p.ageYearsAtReg <= 94,
      ),
    ).toBe(true);
  });

  it("uses stable seed ids", () => {
    expect(seedPatientId(1)).toBe("seed0000000000000000000001");
    expect(patients[0]?.id).toBe(seedPatientId(1));
    expect(patients.every((p) => p.id.startsWith("seed"))).toBe(true);
  });

  it("gives the same people for the same seed, different for another seed", () => {
    expect(generateFakePatients(50, 7)).toEqual(generateFakePatients(50, 7));
    expect(generateFakePatients(50, 7)).not.toEqual(generateFakePatients(50, 8));
  });
});
