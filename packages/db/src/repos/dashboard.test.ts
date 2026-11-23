import { newUlid } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-a", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const NOW = new Date("2026-11-23T06:30:00.000Z");

function seedDay(dateLocal: string, metric: string, dim: string, value: number) {
  t.sqlite
    .prepare(
      `INSERT INTO daily_stats (
         id, created_by, updated_by, date_local, metric, dim, value
       ) VALUES (?, 'system', 'system', ?, ?, ?, ?)`,
    )
    .run(newUlid(), dateLocal, metric, dim, value);
}

beforeEach(() => {
  t = testDb();
});

describe("dashboard (6.3.1)", () => {
  it("builds prepared series from daily_stats for a short range", async () => {
    seedDay("2026-11-20", "arrived_patients", "", 4);
    seedDay("2026-11-20", "new_patients", "", 1);
    seedDay("2026-11-20", "returning_patients", "", 3);
    seedDay("2026-11-20", "billed_paise", "", 10_000);
    seedDay("2026-11-20", "collected_paise", "", 8_000);
    seedDay("2026-11-20", "procedure_count", "RCT", 2);
    seedDay("2026-11-21", "arrived_patients", "", 5);
    seedDay("2026-11-21", "new_patients", "", 2);
    seedDay("2026-11-21", "returning_patients", "", 3);
    seedDay("2026-11-21", "collected_paise", "", 9_000);

    const dash = await repos().dashboard.get(
      { range: "custom", from: "2026-11-20", to: "2026-11-21" },
      NOW,
    );
    expect(dash.range.grain).toBe("day");
    expect(dash.totals.arrived).toBe(9);
    expect(dash.totals.newPatients).toBe(3);
    expect(dash.totals.collectedPaise).toBe(17_000);
    expect(dash.series).toHaveLength(2);
    expect(dash.procedures[0]).toEqual({ dim: "RCT", value: 2 });
    expect(dash.rowsRead).toBeLessThan(2000);
  });

  it("reads under 2000 rows for a 31-day window of dense metrics", async () => {
    // ~40 metrics × 31 days ≈ 1240 rows (plan budget).
    const metrics = [
      ["arrived_patients", ""],
      ["new_patients", ""],
      ["returning_patients", ""],
      ["billed_paise", ""],
      ["collected_paise", ""],
      ["collected_paise", "cash"],
      ["collected_paise", "upi"],
      ["noshow_count", ""],
      ["noshow_arrived", ""],
      ["appt_status", "arrived"],
      ["appt_status", "completed"],
      ["appt_status", "no_show"],
      ["appt_status", "cancelled"],
      ["appt_status", "scheduled"],
      ["appt_status", "confirmed"],
      ["appt_status", "in_chair"],
      ...Array.from({ length: 14 }, (_, i) => ["procedure_count", `Px${i}`] as const),
      ...Array.from({ length: 8 }, (_, i) => ["referral_count", `Ref${i}`] as const),
      ["appt_status", "rescheduled"],
      ["appt_status", "walk_extra"],
    ] as [string, string][];
    expect(metrics.length).toBe(40);

    for (let d = 1; d <= 31; d++) {
      const day = `2026-10-${String(d).padStart(2, "0")}`;
      for (const [metric, dim] of metrics) {
        seedDay(day, metric, dim, 1);
      }
    }

    const dash = await repos().dashboard.get(
      { range: "custom", from: "2026-10-01", to: "2026-10-31" },
      NOW,
    );
    expect(dash.rowsRead).toBe(metrics.length * 31);
    expect(dash.rowsRead).toBeLessThan(2000);
    expect(dash.totals.arrived).toBe(31);
  });

  it("uses live compute for today instead of stored daily_stats", async () => {
    seedDay("2026-11-23", "arrived_patients", "", 99);
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, first_arrived_on)
         VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Live', 'female', 30, '+919000000001', 'active', '2026-11-23')`,
      )
      .run();
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook, arrived_at
         ) VALUES (
           'a1', 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
           '2026-11-23T04:30:00.000Z', '2026-11-23', 600, 630, 'arrived', 'phone', 'normal', 0,
           '2026-11-23T04:30:00.000Z'
         )`,
      )
      .run();

    const dash = await repos().dashboard.get({ range: "today" }, NOW);
    expect(dash.totals.arrived).toBe(1);
    expect(dash.totals.newPatients).toBe(1);
  });

  it("receptionist cannot open the full dashboard", async () => {
    await expect(repos(receptionist).dashboard.get({ range: "today" }, NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
