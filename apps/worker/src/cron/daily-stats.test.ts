import { beforeEach, describe, expect, it } from "vitest";
import { makeEnv } from "../testing/app-env";
import { runNightlyDailyStats } from "./daily-stats";

describe("nightly daily_stats cron (6.2.3)", () => {
  let env: ReturnType<typeof makeEnv>["env"];
  let sqlite: ReturnType<typeof makeEnv>["sqlite"];

  beforeEach(() => {
    ({ env, sqlite } = makeEnv());
    sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, first_arrived_on)
         VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Cron', 'female', 30, '+919000000001', 'active', '2026-11-20')`,
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at, arrived_at
         ) VALUES (
           'a1', 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
           '2026-11-20T04:30:00.000Z', '2026-11-20', 600, 630, 'arrived', 'phone', 'normal', 0, 1,
           '2026-11-20T04:30:00.000Z', '2026-11-20T04:30:00.000Z'
         )`,
      )
      .run();
  });

  it("skips outside the IST midnight window", async () => {
    const result = await runNightlyDailyStats(env, new Date("2026-11-23T11:30:00.000Z"));
    expect(result.ran).toBe(false);
  });

  it("recomputes last 3 days at IST midnight so a corrected day is fixed", async () => {
    // Seed a wrong daily_stats row for 2026-11-20
    sqlite
      .prepare(
        `INSERT INTO daily_stats (id, created_by, updated_by, date_local, metric, dim, value)
         VALUES ('ds1', 'system', 'system', '2026-11-20', 'arrived_patients', '', 99)`,
      )
      .run();

    // 2026-11-22 18:30 UTC = 2026-11-23 00:00 IST → recomputes 23,22,21 (not 20)
    // Use now = 2026-11-20 18:30 UTC = 2026-11-21 00:00 IST so days include 2026-11-20
    const result = await runNightlyDailyStats(env, new Date("2026-11-20T18:30:00.000Z"));
    expect(result.ran).toBe(true);
    expect(result.days).toContain("2026-11-20");

    const row = sqlite
      .prepare(
        `SELECT value FROM daily_stats WHERE date_local = '2026-11-20' AND metric = 'arrived_patients' AND deleted_at IS NULL`,
      )
      .get() as { value: number };
    expect(row.value).toBe(1);
  });
});
