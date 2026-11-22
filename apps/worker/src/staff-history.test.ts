import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p-hist', 'system', 'system', 'P-000101', 'Fake Hist One', 'female', 30, '+919000000101', 'active')`,
    )
    .run();
});

async function get(email: string, path: string) {
  const cookie = await sessionCookie(env, email);
  return app.request(`${ORIGIN}${path}`, { method: "GET", headers: { cookie } }, env);
}

describe("staff history (3.5.11 / 3.5.12)", () => {
  it("doctor and receptionist can load the summary", async () => {
    const doc = await get("doc@example.test", "/api/staff/patients/p-hist/history/summary");
    expect(doc.status).toBe(200);
    const body = (await doc.json()) as {
      data: { summary: { totalVisits: number; alertLabels: string[] } };
    };
    expect(body.data.summary.totalVisits).toBe(0);

    const rec = await get("rec@example.test", "/api/staff/patients/p-hist/history/summary");
    expect(rec.status).toBe(200);
  });

  it("returns an empty feed page with null cursor", async () => {
    const res = await get("doc@example.test", "/api/staff/patients/p-hist/history");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { entries: unknown[]; nextCursor: string | null };
    };
    expect(body.data.entries).toEqual([]);
    expect(body.data.nextCursor).toBeNull();
  });

  it("receptionist feed omits clinical types and X-ray files (3.5.14)", async () => {
    sqlite
      .prepare(
        `INSERT INTO visits (
           id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, chief_complaint
         ) VALUES (
           'v-hist-1', 'doc-a', 'doc-a', 'p-hist', 'doc-a', '2026-11-20', 'final', 'Clinical pain note'
         )`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO medical_history (
           id, created_by, updated_by, patient_id, version_no, answers_json, recorded_at, recorded_by
         ) VALUES (
           'mh-hist-1', 'doc-a', 'doc-a', 'p-hist', 1,
           '[{"code":"hiv","label":"HIV","answer":"yes","restricted":true}]',
           '2026-11-19T10:00:00.000Z', 'doc-a'
         )`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO plan_items (
           id, created_by, updated_by, patient_id, procedure_label, estimate_paise, phase, status, sittings, tooth_fdi
         ) VALUES (
           'plan-hist-1', 'doc-a', 'doc-a', 'p-hist', 'Crown 46', 500000, 1, 'planned', 1, 46
         )`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO consents (
           id, created_by, updated_by, patient_id, type, notice_version, given, given_at, recorded_by, method
         ) VALUES (
           'c-hist-1', 'doc-a', 'doc-a', 'p-hist', 'privacy_notice', 1, 1,
           '2026-11-18T10:00:00.000Z', 'doc-a', 'form'
         )`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority
         ) VALUES (
           'a-hist-1', 'system', 'system', 'p-hist', '1', '01M83VTYPE01CONSULT000001', 'Consultation',
           '2026-11-17T04:30:00.000Z', '2026-11-17', 600, 630, 'completed', 'phone', 'normal'
         )`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO files (
           id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256
         ) VALUES
         ('f-iopa', 'system', 'system', 'p-hist', 'p/fake/iopa', 'iopa', 'image/jpeg', 10,
          'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
         ('f-scan', 'system', 'system', 'p-hist', 'p/fake/scan', 'scan', 'application/pdf', 20,
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')`,
      )
      .run();

    const rec = await get("rec@example.test", "/api/staff/patients/p-hist/history?limit=50");
    expect(rec.status).toBe(200);
    const body = (await rec.json()) as {
      data: { entries: { type: string; status: string | null; summary: string }[] };
    };
    const hidden = new Set(["visit", "treatment", "medical_change", "amendment"]);
    for (const e of body.data.entries) {
      expect(hidden.has(e.type)).toBe(false);
      expect(e.summary).not.toMatch(/Clinical pain|HIV|Crown 46/i);
      if (e.type === "file") expect(["scan", "consent"]).toContain(e.status);
    }
    expect(body.data.entries.some((e) => e.type === "appointment")).toBe(true);
    expect(body.data.entries.some((e) => e.type === "consent")).toBe(true);
    expect(body.data.entries.some((e) => e.type === "file" && e.status === "scan")).toBe(true);
    expect(body.data.entries.some((e) => e.type === "file" && e.status === "iopa")).toBe(false);

    const doc = await get("doc@example.test", "/api/staff/patients/p-hist/history?limit=50");
    const docBody = (await doc.json()) as { data: { entries: { type: string }[] } };
    expect(docBody.data.entries.some((e) => e.type === "visit")).toBe(true);
  });
});
