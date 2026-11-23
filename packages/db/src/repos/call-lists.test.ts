import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const NOW = new Date("2026-11-23T06:30:00.000Z");

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES
         ('p-inc', 'system', 'system', 'P-000101', 'Fake Incomplete', 'female', 30, '+919100000101', 'active'),
         ('p-rec', 'system', 'system', 'P-000102', 'Fake Recall', 'male', 40, '+919100000102', 'active')`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO plan_items (
         id, created_by, updated_by, patient_id, procedure_label, estimate_paise, status, sittings, told_on, created_at
       ) VALUES (
         'pi1', 'system', 'system', 'p-inc', 'RCT', 150000, 'accepted', 1, '2026-09-01', '2026-09-01T10:00:00.000Z'
       )`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO visits (
         id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status
       ) VALUES ('v-rec', 'system', 'system', 'p-rec', 'doc-a', '2026-04-01', 'final')`,
    )
    .run();
});

describe("call lists (6.3.7)", () => {
  it("lists incomplete and recall fake patients, then hides after contact", async () => {
    const incomplete = await repos().callLists.list("incomplete", NOW);
    expect(incomplete.some((r) => r.patientId === "p-inc")).toBe(true);
    expect(incomplete.find((r) => r.patientId === "p-inc")?.amountPaise).toBe(150_000);

    const recall = await repos().callLists.list("recall", NOW);
    expect(recall.some((r) => r.patientId === "p-rec")).toBe(true);

    await repos().callLists.contact("incomplete", "p-inc", { note: "Called mother" }, NOW);
    const after = await repos().callLists.list("incomplete", NOW);
    expect(after.some((r) => r.patientId === "p-inc")).toBe(false);

    await repos().callLists.contact("recall", "p-rec", { note: "SMS later" }, NOW);
    const afterRec = await repos().callLists.list("recall", NOW);
    expect(afterRec.some((r) => r.patientId === "p-rec")).toBe(false);
  });
});
