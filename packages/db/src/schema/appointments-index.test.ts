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
});
