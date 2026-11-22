import { firstPage } from "@clinic/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { patientSearch, patients } from "../schema";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";
import { testDb } from "../testing";
import { patientsRepo } from "./patients";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r2" };

beforeEach(async () => {
  await db.delete(patientSearch);
  await db.delete(patients);
  const rows = [
    row("a", "P-000001", "Rahul Sharma", "male", 34, "+919000000001"),
    row("b", "P-000002", "Neha Gupta", "female", 29, "+919000000002"),
    row("c", "P-000003", "Karan Yadav", "male", 41, "+919000000003"),
  ];
  await db.insert(patients).values(rows);
  for (const r of rows) {
    await db.batch([
      ...rebuildPatientSearchStatements(
        db,
        r.id,
        {
          fullName: r.fullName,
          code: r.code,
          mobile: r.mobile,
          mobileSecondary: null,
          legacyRef: null,
        },
        "system",
      ),
    ]);
  }
});

describe("patientsRepo.list (1.1.7 / 2.1.6)", () => {
  it("returns a page for doctor and receptionist roles", async () => {
    const page = await patientsRepo(db, doctor).list(firstPage());
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.code)).toEqual(["P-000001", "P-000002", "P-000003"]);
  });

  it("refuses developer (no patient data)", async () => {
    await expect(patientsRepo(db, developer).list(firstPage())).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("filters by name, code, mobile or last four digits via tokens", async () => {
    const byName = await patientsRepo(db, doctor).list({ ...firstPage(), q: "neha" });
    expect(byName.rows.map((r) => r.fullName)).toEqual(["Neha Gupta"]);
    const byCode = await patientsRepo(db, doctor).list({ ...firstPage(), q: "000001" });
    expect(byCode.rows[0]?.code).toBe("P-000001");
    const byMobile = await patientsRepo(db, doctor).list({ ...firstPage(), q: "9000000002" });
    expect(byMobile.rows[0]?.fullName).toBe("Neha Gupta");
    const byLast4 = await patientsRepo(db, doctor).list({ ...firstPage(), q: "0002" });
    expect(byLast4.rows.some((r) => r.fullName === "Neha Gupta")).toBe(true);
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
