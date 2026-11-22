import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { patientSearch, patients } from "../schema";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";
import { testDb } from "../testing";
import { patientDuplicatesRepo } from "./patient-duplicates";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };
const day = "2026-11-22";

beforeEach(async () => {
  await db.delete(patientSearch);
  await db.delete(patients);
});

async function addPatient(input: {
  id: string;
  code: string;
  fullName: string;
  mobile: string;
  age?: number;
  dob?: string;
  secondary?: string;
}) {
  await db.insert(patients).values({
    id: input.id,
    code: input.code,
    fullName: input.fullName,
    gender: "male",
    ageYearsAtReg: input.age ?? 30,
    dateOfBirth: input.dob ?? null,
    mobile: input.mobile,
    mobileSecondary: input.secondary ?? null,
    createdBy: "system",
    updatedBy: "system",
  });
  await db.batch([
    ...rebuildPatientSearchStatements(
      db,
      input.id,
      {
        fullName: input.fullName,
        code: input.code,
        mobile: input.mobile,
        mobileSecondary: input.secondary ?? null,
        legacyRef: null,
      },
      "system",
    ),
  ]);
}

describe("patientDuplicatesRepo (2.1.7)", () => {
  it("warns when Rahul Sharma and Rahul Sarma share a mobile", async () => {
    await addPatient({
      id: "p1",
      code: "P-000001",
      fullName: "Rahul Sharma",
      mobile: "+919876543210",
      age: 34,
    });
    const hits = await patientDuplicatesRepo(db, doctor).findWarnings({
      fullName: "Rahul Sarma",
      mobile: "9876543210",
      mobileSecondary: null,
      dateOfBirth: null,
      ageYearsAtReg: 34,
      onDate: day,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.fullName).toBe("Rahul Sharma");
    expect(hits[0]?.reason).toBe("mobile_name");
  });

  it("warns for two brothers on the same mobile but still returns soft hits only", async () => {
    await addPatient({
      id: "b1",
      code: "P-000010",
      fullName: "Amit Kumar",
      mobile: "+919000001111",
      age: 20,
    });
    const hits = await patientDuplicatesRepo(db, doctor).findWarnings({
      fullName: "Suresh Kumar",
      mobile: "9000001111",
      mobileSecondary: null,
      dateOfBirth: null,
      ageYearsAtReg: 18,
      onDate: day,
    });
    expect(hits.some((h) => h.reason === "mobile_name")).toBe(true);
    // Soft warning: callers never hard-block; this function only lists hits.
    expect(hits.length).toBeLessThanOrEqual(3);
  });

  it("returns nothing for unrelated people", async () => {
    await addPatient({
      id: "x1",
      code: "P-000020",
      fullName: "Neha Gupta",
      mobile: "+919000002222",
      age: 29,
    });
    const hits = await patientDuplicatesRepo(db, doctor).findWarnings({
      fullName: "Karan Yadav",
      mobile: "9000003333",
      mobileSecondary: null,
      dateOfBirth: null,
      ageYearsAtReg: 41,
      onDate: day,
    });
    expect(hits).toEqual([]);
  });
});
