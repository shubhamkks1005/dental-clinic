import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError } from "../errors";
import { patients } from "../schema";
import { testDb } from "../testing";
import { patientUpdateRepo } from "./patient-update";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };

const baseInput = {
  fullName: "Fake Edited",
  gender: "female" as const,
  dateOfBirth: null,
  ageYearsAtReg: 30,
  mobile: "+919222222222",
  noMobileReason: null,
  mobileSecondary: null,
  area: "Fake Area",
  email: null,
  referralSourceId: null,
  referredBy: null,
  emergencyName: null,
  emergencyRelation: null,
  emergencyMobile: null,
  guardianName: null,
  guardianRelation: null,
  guardianMobile: null,
  messageLanguage: null,
  legacyRef: null,
  notes: "Prefers mornings",
};

beforeEach(() => {
  sqlite.exec("DELETE FROM patient_search; DELETE FROM patients; DELETE FROM audit_log;");
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO users (id, email, name, role, status, created_by, updated_by)
       VALUES ('doc-1', 'doc@example.test', 'Dev Doctor', 'doctor', 'active', 'system', 'system')`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, version)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Old', 'female', 30, '+919000000001', 'active', 1)`,
    )
    .run();
});

describe("patientUpdateRepo (2.2.4)", () => {
  it("updates fields, audits old and new mobile, bumps version", async () => {
    const updated = await patientUpdateRepo(db, doctor).update("p1", {
      ...baseInput,
      version: 1,
    });
    expect(updated).toMatchObject({
      fullName: "Fake Edited",
      mobile: "+919222222222",
      area: "Fake Area",
      version: 2,
    });
    const audit = sqlite
      .prepare("SELECT before_json, after_json FROM audit_log WHERE table_name = 'patients'")
      .get() as { before_json: string; after_json: string };
    expect(JSON.parse(audit.before_json)).toMatchObject({ mobile: "+919000000001" });
    expect(JSON.parse(audit.after_json)).toMatchObject({ mobile: "+919222222222" });
  });

  it("rejects a stale version (two-tab edit)", async () => {
    await patientUpdateRepo(db, doctor).update("p1", { ...baseInput, version: 1 });
    await expect(
      patientUpdateRepo(db, doctor).update("p1", {
        ...baseInput,
        fullName: "Stale Tab",
        version: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    const row = await db.select({ fullName: patients.fullName }).from(patients).get();
    expect(row?.fullName).toBe("Fake Edited");
  });
});
