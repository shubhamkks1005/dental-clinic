import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTPRINT001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009943', 'Fake Print Hist', 'female', 28, '+919900001157', 'active')`,
    )
    .run(PATIENT_ID);
  t.sqlite
    .prepare(
      `INSERT INTO users (id, created_by, updated_by, email, name, role)
       VALUES ('doc-a', 'system', 'system', 'doc@example.test', 'Dr Fake', 'doctor')
       ON CONFLICT(id) DO NOTHING`,
    )
    .run();
});

describe("history print summary (6.7.2)", () => {
  it("doctor gets patient, allergies, visits, treatments", async () => {
    t.sqlite
      .prepare(
        `INSERT INTO alerts (id, created_by, updated_by, patient_id, code, label, restricted, active)
         VALUES ('al-1', 'doc-a', 'doc-a', ?, 'allergy_penicillin', 'Penicillin allergy', 0, 1)`,
      )
      .run(PATIENT_ID);
    t.sqlite
      .prepare(
        `INSERT INTO visits (
           id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, chief_complaint
         ) VALUES (
           'v-print-1', 'doc-a', 'doc-a', ?, 'doc-a', '2026-10-01', 'final', 'Pain'
         )`,
      )
      .run(PATIENT_ID);
    t.sqlite
      .prepare(
        `INSERT INTO visit_diagnoses (
           id, created_by, updated_by, visit_id, label, sort_order
         ) VALUES ('dx-p-1', 'doc-a', 'doc-a', 'v-print-1', 'Pulpitis', 0)`,
      )
      .run();
    t.sqlite
      .prepare(
        `INSERT INTO plan_items (
           id, created_by, updated_by, patient_id, procedure_label, estimate_paise, phase, status, sittings, tooth_fdi
         ) VALUES (
           'plan-p-1', 'doc-a', 'doc-a', ?, 'RCT', 800000, 1, 'planned', 2, 36
         )`,
      )
      .run(PATIENT_ID);

    const summary = await repos(doctor).history.getPrintSummary(PATIENT_ID);
    expect(summary.patient.code).toBe("P-009943");
    expect(summary.allergies).toContain("Penicillin allergy");
    expect(summary.visits).toHaveLength(1);
    expect(summary.visits[0]?.diagnoses).toContain("Pulpitis");
    expect(summary.treatments).toHaveLength(1);
    expect(summary.treatments[0]?.toothFdi).toBe(36);
  });

  it("receptionist cannot load print summary", async () => {
    await expect(repos(receptionist).history.getPrintSummary(PATIENT_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
