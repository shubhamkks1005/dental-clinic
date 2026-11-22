import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { testDb } from "../testing";
import { patientGetRepo } from "./patient-get";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };

beforeEach(() => {
  sqlite.exec("DELETE FROM patients;");
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Profile', 'female', 32, '+919000000001', 'active')`,
    )
    .run();
});

describe("patientGetRepo (2.2.2)", () => {
  it("returns the patient", async () => {
    const row = await patientGetRepo(db, doctor).get("p1");
    expect(row).toMatchObject({
      id: "p1",
      code: "P-000001",
      fullName: "Fake Profile",
      mobile: "+919000000001",
    });
  });

  it("throws when missing", async () => {
    await expect(patientGetRepo(db, doctor).get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
