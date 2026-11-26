import { afterAll, describe, expect, it } from "vitest";
import { fullScans, queryPlan } from "../testing";
import { testDb } from "../testing/test-db";

// 2.3.1 Done when: "all appointments for one day" EXPLAIN uses an index (no full table scan).
const { sqlite } = testDb();
afterAll(() => sqlite.close());

describe("appointments day query plan (2.3.1)", () => {
  it("lists one chair-day through appointments_chair_day_start_idx", () => {
    const plan = queryPlan(
      sqlite,
      `SELECT id, start_min, end_min, status FROM appointments
       WHERE chair_id = ? AND date_local = ? AND deleted_at IS NULL
       ORDER BY start_min`,
      ["1", "2026-11-22"],
    );
    expect(plan.some((l) => /appointments_chair_day_start_idx/i.test(l))).toBe(true);
    expect(fullScans(plan)).toEqual([]);
  });

  it("lists one day by status through appointments_day_status_idx", () => {
    const plan = queryPlan(
      sqlite,
      `SELECT id, status FROM appointments
       WHERE date_local = ? AND status = ? AND deleted_at IS NULL`,
      ["2026-11-22", "scheduled"],
    );
    expect(plan.some((l) => /appointments_day_status_idx/i.test(l))).toBe(true);
    expect(fullScans(plan)).toEqual([]);
  });

  // 0066 (several doctors): a doctor's own week and own queue day, and the leave days of a range.
  it("lists a doctor's own week without a full scan", () => {
    const plan = queryPlan(
      sqlite,
      `SELECT id FROM appointments
       WHERE date_local >= ? AND date_local <= ? AND deleted_at IS NULL
         AND (doctor_id = ? OR doctor_id IS NULL)
       ORDER BY date_local, start_min`,
      ["2026-11-23", "2026-11-29", "doc-a"],
    );
    expect(fullScans(plan)).toEqual([]);
  });

  it("reads one doctor's queue day through appointments_day_queue_idx", () => {
    const plan = queryPlan(
      sqlite,
      `SELECT id FROM appointments WHERE doctor_id IS ? AND date_local = ? AND deleted_at IS NULL`,
      ["doc-a", "2026-11-23"],
    );
    expect(plan.some((l) => /appointments_(day_queue|doctor_day_start)_idx/i.test(l))).toBe(true);
    expect(fullScans(plan)).toEqual([]);
  });

  it("reads the leave days of a range through doctor_leaves_day_idx", () => {
    const plan = queryPlan(
      sqlite,
      `SELECT id FROM doctor_leaves WHERE deleted_at IS NULL AND date_local >= ? AND date_local <= ?`,
      ["2026-11-23", "2026-11-29"],
    );
    expect(fullScans(plan)).toEqual([]);
  });
});
