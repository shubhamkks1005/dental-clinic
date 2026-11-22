import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { patientSearch, patients } from "../schema";
import { testDb } from "../testing";
import { patientCreateRepo } from "./patient-create";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };

beforeEach(() => {
  sqlite.exec("DELETE FROM patient_search; DELETE FROM patients; DELETE FROM audit_log;");
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO users (id, email, name, role, status, created_by, updated_by)
       VALUES ('doc-1', 'doc@example.test', 'Dev Doctor', 'doctor', 'active', 'system', 'system')`,
    )
    .run();
});

describe("patientCreateRepo (2.2.1)", () => {
  it("mints a P- code, writes search tokens, and audits", async () => {
    const created = await patientCreateRepo(db, doctor).create({
      fullName: "Fake Create One",
      gender: "female",
      dateOfBirth: null,
      ageYearsAtReg: 28,
      mobile: "+919111111111",
      noMobileReason: null,
      mobileSecondary: null,
      area: null,
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
      notes: null,
      contactRelation: "self" as const,
      consents: { noticeShown: false, smsReminders: false, marketing: false },
    });
    expect(created.code).toMatch(/^P-\d{6}$/);
    expect(created.fullName).toBe("Fake Create One");

    const tokens = await db
      .select({ token: patientSearch.token, kind: patientSearch.kind })
      .from(patientSearch)
      .all();
    expect(tokens.some((t) => t.kind === "name" && t.token === "fake")).toBe(true);
    expect(tokens.some((t) => t.kind === "code" && t.token === created.code.toLowerCase())).toBe(
      true,
    );
    expect(tokens.some((t) => t.kind === "mobile" && t.token === "9111111111")).toBe(true);

    const audit = sqlite.prepare("SELECT action, table_name FROM audit_log").get() as {
      action: string;
      table_name: string;
    };
    expect(audit).toMatchObject({ action: "create", table_name: "patients" });

    const row = await db.select().from(patients).get();
    expect(row?.code).toBe(created.code);
  });
});
