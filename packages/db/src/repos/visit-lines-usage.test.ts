import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const P = "01M83PATIENTLINEUSE001";
const NOW = new Date("2026-11-25T05:00:00.000Z");

let t: ReturnType<typeof testDb>;
const run = (sql: string, ...args: unknown[]) => t.sqlite.prepare(sql).run(...args);

beforeEach(() => {
  t = testDb();
  run(
    `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
     VALUES (?, 's', 's', 'P-009931', 'Fake Usage Patient', 'female', 28, '+919900001177', 'active')`,
    P,
  );
  const visit = (id: string, on: string, status: string) =>
    run(
      `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
       VALUES (?, 's', 's', ?, 'doc-a', ?, ?)`,
      id,
      P,
      on,
      status,
    );
  visit("v-new", "2026-11-20", "final");
  visit("v-draft", "2026-11-25", "draft");
  visit("v-old", "2026-09-01", "final");
  visit("v-void", "2026-11-21", "void");
  const dx = (id: string, v: string, label: string, deleted = false) =>
    run(
      `INSERT INTO visit_diagnoses (id, created_by, updated_by, visit_id, label, deleted_at)
       VALUES (?, 's', 's', ?, ?, ?)`,
      id,
      v,
      label,
      deleted ? "2026-11-22T00:00:00.000Z" : null,
    );
  dx("d1", "v-new", "Irreversible pulpitis");
  dx("d2", "v-draft", "irreversible pulpitis");
  dx("d3", "v-old", "Irreversible pulpitis"); // too old
  dx("d4", "v-void", "Pericoronitis"); // void visit
  dx("d5", "v-new", "Root stump", true); // removed line
  const pr = (id: string, v: string, label: string) =>
    run(
      `INSERT INTO visit_procedures (id, created_by, updated_by, visit_id, label) VALUES (?, 's', 's', ?, ?)`,
      id,
      v,
      label,
    );
  pr("p1", "v-new", "RCT started");
  pr("p2", "v-draft", "RCT started");
  pr("p3", "v-draft", "Composite filling");
  pr("p4", "v-old", "Composite filling");
});

describe("diagnosis and procedure usage, last 30 days (design 30 'popular')", () => {
  it("counts lines per lower-case name, leaving out old, void and removed ones", async () => {
    const usage = await createRepos(t.db, doctor).visitDiagnoses.diagnosisProcedureUsage30d(NOW);
    expect(usage.diagnoses).toEqual({ "irreversible pulpitis": 2 });
    expect(usage.procedures).toEqual({ "rct started": 2, "composite filling": 1 });
  });

  it("is doctor only", async () => {
    await expect(
      createRepos(t.db, receptionist).visitDiagnoses.diagnosisProcedureUsage30d(NOW),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
