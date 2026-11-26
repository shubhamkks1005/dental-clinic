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

const probe = (fullName: string, mobile: string | null, secondary: string | null = null) =>
  patientDuplicatesRepo(db, doctor).findWarnings({
    fullName,
    mobile,
    mobileSecondary: secondary,
    dateOfBirth: null,
    ageYearsAtReg: 30,
    onDate: day,
  });

describe("patientDuplicatesRepo (2.1.7, owner Q5 2026-11-26)", () => {
  it("same first name and same mobile: first_name_mobile", async () => {
    await addPatient({
      id: "a",
      code: "P-000001",
      fullName: "Aakash Verma",
      mobile: "+919000001111",
    });
    const hits = await probe("aakash K", "90000 01111");
    expect(hits).toEqual([
      expect.objectContaining({ id: "a", code: "P-000001", reason: "first_name_mobile" }),
    ]);
  });

  it("family on one mobile: mobile_only, and same-first-name hits come first", async () => {
    await addPatient({
      id: "w",
      code: "P-000002",
      fullName: "Ritu Verma",
      mobile: "+919000001111",
    });
    await addPatient({
      id: "h",
      code: "P-000003",
      fullName: "Aakash Verma",
      mobile: "+919000001111",
    });
    const hits = await probe("Aakash Verma", "9000001111");
    expect(hits.map((h) => [h.id, h.reason])).toEqual([
      ["h", "first_name_mobile"],
      ["w", "mobile_only"],
    ]);
  });

  it("the other mobile matches too", async () => {
    await addPatient({
      id: "s",
      code: "P-000004",
      fullName: "Sunita Rao",
      mobile: "+919111111111",
      secondary: "+919000004444",
    });
    expect((await probe("Sunita", "9000004444"))[0]?.reason).toBe("first_name_mobile");
  });

  it("same name on another mobile is no longer a match (no name+age rule)", async () => {
    await addPatient({
      id: "n",
      code: "P-000005",
      fullName: "Aakash Verma",
      mobile: "+919000005555",
    });
    expect(await probe("Aakash Verma", "9000006666")).toEqual([]);
    expect(await probe("Aakash Verma", null)).toEqual([]);
  });

  it("caps at 3 but never cuts a same-first-name hit", async () => {
    for (let i = 0; i < 4; i++) {
      await addPatient({
        id: `m${i}`,
        code: `P-00001${i}`,
        fullName: `Other${i} Shah`,
        mobile: "+919000007777",
      });
    }
    await addPatient({
      id: "exact",
      code: "P-000019",
      fullName: "Kiran Shah",
      mobile: "+919000007777",
    });
    const hits = await probe("Kiran", "9000007777");
    expect(hits[0]).toMatchObject({ id: "exact", reason: "first_name_mobile" });
    expect(hits).toHaveLength(3);
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
