import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTSUMM001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009931', 'Fake History Patient', 'female', 30, '+919900001144', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history summary (3.5.11)", () => {
  it("returns empty strip for a new patient and writes access_log", async () => {
    const summary = await repos().history.getSummary(PATIENT_ID);
    expect(summary).toMatchObject({
      firstVisitDate: null,
      lastVisitDate: null,
      totalVisits: 0,
      outstandingDuePaise: 0,
      nextAppointment: null,
      hasAlert: false,
    });
    const access = t.sqlite
      .prepare(
        `SELECT action, resource, resource_id FROM access_log WHERE resource = 'patient_history'`,
      )
      .all();
    expect(access).toEqual([
      { action: "view", resource: "patient_history", resource_id: PATIENT_ID },
    ]);
  });

  it("counts visits and hides alert labels from receptionist", async () => {
    const v1 = await repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-10-01" });
    await repos().visits.finalise(v1.id, { version: v1.version });
    await repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-11-01" });

    t.sqlite
      .prepare(
        `INSERT INTO alerts (id, created_by, updated_by, patient_id, code, label, restricted, active)
         VALUES ('01M83ALERT01HISTTEST0001', 'system', 'system', ?, 'penicillin', 'Penicillin allergy', 1, 1)`,
      )
      .run(PATIENT_ID);

    const doc = await repos(doctor).history.getSummary(PATIENT_ID);
    expect(doc.totalVisits).toBe(2);
    expect(doc.firstVisitDate).toBe("2026-10-01");
    expect(doc.lastVisitDate).toBe("2026-11-01");
    expect(doc.alertLabels).toContain("Penicillin allergy");
    expect(doc.hasRestricted).toBe(true);

    const rec = await repos(receptionist).history.getSummary(PATIENT_ID);
    expect(rec.totalVisits).toBe(2);
    expect(rec.alertLabels).toEqual([]);
    expect(rec.hasAlert).toBe(true);
    expect(rec.hasRestricted).toBe(true);
  });

  it("refuses developer", async () => {
    await expect(repos(developer).history.getSummary(PATIENT_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
