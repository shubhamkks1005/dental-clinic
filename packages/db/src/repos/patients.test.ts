import { firstPage } from "@clinic/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { patients } from "../schema";
import { testDb } from "../testing";
import { patientsRepo } from "./patients";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r2" };

beforeEach(async () => {
  await db.delete(patients);
  await db
    .insert(patients)
    .values([
      row("a", "P-000001", "Rahul Sharma", "male", 34, "+919000000001"),
      row("b", "P-000002", "Neha Gupta", "female", 29, "+919000000002"),
      row("c", "P-000003", "Karan Yadav", "male", 41, "+919000000003"),
    ]);
});

describe("patientsRepo.list (1.1.7)", () => {
  it("returns a page for doctor and receptionist roles", async () => {
    const page = await patientsRepo(db, doctor).list(firstPage());
    expect(page.total).toBe(3);
    // Same created_at → secondary sort by code ascending.
    expect(page.rows.map((r) => r.code)).toEqual(["P-000001", "P-000002", "P-000003"]);
  });

  it("refuses developer (no patient data)", async () => {
    await expect(patientsRepo(db, developer).list(firstPage())).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("filters by name, code or mobile fragment", async () => {
    const byName = await patientsRepo(db, doctor).list({ ...firstPage(), q: "neha" });
    expect(byName.rows.map((r) => r.fullName)).toEqual(["Neha Gupta"]);
    const byCode = await patientsRepo(db, doctor).list({ ...firstPage(), q: "000001" });
    expect(byCode.rows[0]?.code).toBe("P-000001");
    const byMobile = await patientsRepo(db, doctor).list({ ...firstPage(), q: "9000000002" });
    expect(byMobile.rows[0]?.fullName).toBe("Neha Gupta");
  });
});

function row(
  id: string,
  code: string,
  fullName: string,
  gender: "female" | "male" | "other",
  age: number,
  mobile: string,
) {
  return {
    id,
    code,
    fullName,
    gender,
    ageYearsAtReg: age,
    mobile,
    status: "active" as const,
    createdBy: "system",
    updatedBy: "system",
  };
}
