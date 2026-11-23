import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTFILT001";
const VISIT_TYPE = "01M83VTYPE01CONSULT000001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009942', 'Fake Filter Patient', 'female', 30, '+919900001156', 'active')`,
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

describe("history feed filters (6.7.1)", () => {
  beforeEach(() => {
    t.sqlite
      .prepare(
        `INSERT INTO visits (
           id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, chief_complaint, created_at
         ) VALUES (
           'v-filt-1', 'doc-a', 'doc-a', ?, 'doc-a', '2026-06-15', 'final', 'Toothache',
           '2026-06-15T04:00:00.000Z'
         )`,
      )
      .run(PATIENT_ID);
    t.sqlite
      .prepare(
        `INSERT INTO visit_diagnoses (
           id, created_by, updated_by, visit_id, label, tooth_fdi, sort_order
         ) VALUES (
           'dx-filt-1', 'doc-a', 'doc-a', 'v-filt-1', 'Deep caries', 36, 0
         )`,
      )
      .run();
    t.sqlite
      .prepare(
        `INSERT INTO plan_items (
           id, created_by, updated_by, patient_id, procedure_label, estimate_paise, phase, status, sittings, tooth_fdi, created_at
         ) VALUES (
           'plan-filt-1', 'doc-a', 'doc-a', ?, 'Crown 36', 500000, 1, 'planned', 1, 36,
           '2026-07-01T04:00:00.000Z'
         )`,
      )
      .run(PATIENT_ID);
    t.sqlite
      .prepare(
        `INSERT INTO plan_items (
           id, created_by, updated_by, patient_id, procedure_label, estimate_paise, phase, status, sittings, tooth_fdi, created_at
         ) VALUES (
           'plan-filt-2', 'doc-a', 'doc-a', ?, 'Scaling', 100000, 1, 'planned', 1, NULL,
           '2026-08-01T04:00:00.000Z'
         )`,
      )
      .run(PATIENT_ID);
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority
         ) VALUES (
           'a-filt-1', 'system', 'system', ?, '1', ?, 'Consultation',
           '2026-09-01T04:30:00.000Z', '2026-09-01', 600, 630, 'completed', 'phone', 'normal'
         )`,
      )
      .run(PATIENT_ID, VISIT_TYPE);
    t.sqlite
      .prepare(
        `INSERT INTO files (
           id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, tooth_fdi, created_at
         ) VALUES (
           'f-filt-1', 'doc-a', 'doc-a', ?, 'p/fake/scan-filt', 'scan', 'image/jpeg', 100,
           'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 36,
           '2026-05-01T04:00:00.000Z'
         )`,
      )
      .run(PATIENT_ID);
  });

  it("chip treatments returns only treatments", async () => {
    const page = await repos().history.listFeed(PATIENT_ID, { chip: "treatments", limit: 20 });
    expect(page.entries.length).toBeGreaterThan(0);
    expect(page.entries.every((e) => e.type === "treatment")).toBe(true);
  });

  it("chip appointments returns only appointments", async () => {
    const page = await repos().history.listFeed(PATIENT_ID, { chip: "appointments", limit: 20 });
    expect(page.entries).toHaveLength(1);
    expect(page.entries[0]?.type).toBe("appointment");
  });

  it("date range keeps June visit and drops September appointment", async () => {
    const page = await repos().history.listFeed(PATIENT_ID, {
      from: "2026-06-01",
      to: "2026-06-30",
      limit: 20,
    });
    expect(page.entries.some((e) => e.type === "visit")).toBe(true);
    expect(page.entries.some((e) => e.type === "appointment")).toBe(false);
  });

  it("tooth 36 keeps matching visit, treatment, file", async () => {
    const page = await repos().history.listFeed(PATIENT_ID, { tooth: 36, limit: 20 });
    const types = new Set(page.entries.map((e) => e.type));
    expect(types.has("visit")).toBe(true);
    expect(types.has("treatment")).toBe(true);
    expect(types.has("file")).toBe(true);
    expect(types.has("appointment")).toBe(false);
    expect(page.entries.every((e) => e.type !== "treatment" || e.summary.includes("36"))).toBe(
      true,
    );
  });

  it("text search finds Crown treatment and caries visit", async () => {
    const crown = await repos().history.listFeed(PATIENT_ID, { q: "crown", limit: 20 });
    expect(crown.entries.some((e) => e.type === "treatment")).toBe(true);
    expect(crown.entries.every((e) => e.type === "visit" || e.type === "treatment")).toBe(true);

    const caries = await repos().history.listFeed(PATIENT_ID, { q: "caries", limit: 20 });
    expect(caries.entries.some((e) => e.type === "visit")).toBe(true);
  });

  it("bills chip + tooth returns empty (no matching types)", async () => {
    const page = await repos().history.listFeed(PATIENT_ID, {
      chip: "bills",
      tooth: 36,
      limit: 20,
    });
    expect(page.entries).toEqual([]);
  });

  it("filtered page on mixed rows stays under 1 second", async () => {
    for (let i = 0; i < 40; i++) {
      const day = String((i % 28) + 1).padStart(2, "0");
      t.sqlite
        .prepare(
          `INSERT INTO plan_items (
             id, created_by, updated_by, patient_id, procedure_label, estimate_paise, phase, status, sittings, tooth_fdi, created_at
           ) VALUES (?, 'doc-a', 'doc-a', ?, 'Fill', 50000, 1, 'planned', 1, 46, ?)`,
        )
        .run(`plan-speed-${i}`, PATIENT_ID, `2025-01-${day}T04:00:00.000Z`);
    }
    const started = Date.now();
    const page = await repos().history.listFeed(PATIENT_ID, {
      chip: "treatments",
      tooth: 46,
      limit: 30,
    });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(page.entries.length).toBeGreaterThan(0);
    expect(page.entries.every((e) => e.type === "treatment")).toBe(true);
  });
});
