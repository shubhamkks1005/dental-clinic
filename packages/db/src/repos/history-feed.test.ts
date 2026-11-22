import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTFEED001";
const VISIT_TYPE = "01M83VTYPE01CONSULT000001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009941', 'Fake Feed Patient', 'female', 30, '+919900001155', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history feed (3.5.12)", () => {
  it("merges visits and appointments newest first with cursor pages", async () => {
    for (let i = 0; i < 5; i++) {
      const day = String(i + 1).padStart(2, "0");
      await repos().visits.open({
        patientId: PATIENT_ID,
        visitDateLocal: `2026-10-${day}`,
      });
    }
    for (let i = 0; i < 5; i++) {
      const day = String(i + 10).padStart(2, "0");
      const id = `01M83APPTFEEDTEST0000${i}`;
      t.sqlite
        .prepare(
          `INSERT INTO appointments (
             id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
             start_at, date_local, start_min, end_min, status, source, priority
           ) VALUES (
             ?, 'system', 'system', ?, '1', ?, 'Consultation',
             ?, ?, 600, 630, 'completed', 'phone', 'normal'
           )`,
        )
        .run(id, PATIENT_ID, VISIT_TYPE, `2026-09-${day}T04:30:00.000Z`, `2026-09-${day}`);
    }

    const first = await repos().history.listFeed(PATIENT_ID, { limit: 4 });
    expect(first.entries).toHaveLength(4);
    expect(first.nextCursor).toBeTruthy();
    for (let i = 1; i < first.entries.length; i++) {
      const a = first.entries[i - 1]!;
      const b = first.entries[i]!;
      expect(a.at >= b.at).toBe(true);
    }

    const second = await repos().history.listFeed(PATIENT_ID, {
      limit: 4,
      cursor: first.nextCursor!,
    });
    expect(second.entries.length).toBeGreaterThan(0);
    expect(second.entries[0]?.id).not.toBe(first.entries[0]?.id);

    const access = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM access_log WHERE resource = 'patient_history'`)
      .get() as { n: number };
    expect(access.n).toBeGreaterThanOrEqual(2);
  });

  it("first page of 40 mixed rows stays under 1 second", async () => {
    for (let i = 0; i < 40; i++) {
      const month = i < 20 ? "10" : "11";
      const day = String((i % 20) + 1).padStart(2, "0");
      await repos().visits.open({
        patientId: PATIENT_ID,
        visitDateLocal: `2025-${month}-${day}`,
      });
    }
    const started = Date.now();
    const page = await repos().history.listFeed(PATIENT_ID, { limit: 30 });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(page.entries).toHaveLength(30);
    expect(page.nextCursor).toBeTruthy();
  });
});
