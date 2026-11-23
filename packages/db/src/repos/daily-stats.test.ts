import { STAT_DIM_NONE } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-a", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const DAY = "2026-11-15";
const MONTH = "2026-11";
const START = "2026-11-15T04:30:00.000Z";

function val(rows: { metric: string; dim: string; value: number }[], metric: string, dim = "") {
  return rows.find((r) => r.metric === metric && r.dim === dim)?.value ?? null;
}

beforeEach(() => {
  t = testDb();
  // Hand-counted fake day 2026-11-15:
  // arrived distinct = p1,p2,p3 → 3; new = p1 only (p3 has legacy_ref) → 1; returning = 2
  // appt: arrived×2, completed×1, no_show×1, cancelled×1
  // billed issued 50_000; cancelled bill ignored
  // payments: cash 30_000 + upi split 10_000 on one row amount 40_000; refund cash 5_000
  //   → collected total 35_000; cash 25_000; upi 10_000
  // procedures: RCT×2, Scaling×1; referral friend×1
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, first_arrived_on, legacy_ref, referral_source_id)
       VALUES
         ('p1', 'system', 'system', 'P-000001', 'Fake New', 'female', 30, '+919000000001', 'active', ?, NULL, 'friend'),
         ('p2', 'system', 'system', 'P-000002', 'Fake Return', 'male', 40, '+919000000002', 'active', '2026-10-01', NULL, NULL),
         ('p3', 'system', 'system', 'P-000003', 'Fake Legacy', 'female', 50, '+919000000003', 'active', ?, 'PAPER-1', NULL)`,
    )
    .run(DAY, DAY);

  const appts: [string, string, string][] = [
    ["a1", "p1", "arrived"],
    ["a2", "p2", "arrived"],
    ["a3", "p3", "completed"],
    ["a4", "p2", "no_show"],
    ["a5", "p1", "cancelled"],
  ];
  for (const [id, pid, status] of appts) {
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at,
           arrived_at
         ) VALUES (?, 'system', 'system', ?, '1', 'vt1', 'Consultation', ?, ?, 600, 630, ?, 'phone', 'normal', 0, 1, ?, ?)`,
      )
      .run(
        id,
        pid,
        START,
        DAY,
        status,
        START,
        status === "arrived" || status === "completed" ? START : null,
      );
  }

  t.sqlite
    .prepare(
      `INSERT INTO bills (
         id, created_by, updated_by, patient_id, bill_on, status, kind, total_paise, subtotal_paise
       ) VALUES
         ('b1', 'system', 'system', 'p1', ?, 'issued', 'normal', 50000, 50000),
         ('b2', 'system', 'system', 'p2', ?, 'cancelled', 'normal', 10000, 10000)`,
    )
    .run(DAY, DAY);

  t.sqlite
    .prepare(
      `INSERT INTO payments (
         id, created_by, updated_by, patient_id, amount_paise, mode, split_mode, split_paise,
         received_at, received_by, day_local
       ) VALUES (
         'pay1', 'system', 'system', 'p1', 40000, 'cash', 'upi', 10000,
         ?, 'doc-a', ?
       )`,
    )
    .run(START, DAY);

  t.sqlite
    .prepare(
      `INSERT INTO refunds (
         id, created_by, updated_by, payment_id, patient_id, amount_paise, mode, reason,
         approved_by, approved_at
       ) VALUES (
         'ref1', 'system', 'system', 'pay1', 'p1', 5000, 'cash', 'Fake refund',
         'doc-a', ?
       )`,
    )
    .run(START);

  t.sqlite
    .prepare(
      `INSERT INTO visits (
         id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status
       ) VALUES ('v1', 'system', 'system', 'p1', 'doc-a', ?, 'final')`,
    )
    .run(DAY);
  t.sqlite
    .prepare(
      `INSERT INTO visit_procedures (
         id, created_by, updated_by, visit_id, label, surfaces_json, sort_order
       ) VALUES
         ('vp1', 'system', 'system', 'v1', 'RCT', '[]', 0),
         ('vp2', 'system', 'system', 'v1', 'RCT', '[]', 1),
         ('vp3', 'system', 'system', 'v1', 'Scaling', '[]', 2)`,
    )
    .run();
});

describe("daily_stats (6.2.2)", () => {
  it("day metrics match hand count; recompute is idempotent", async () => {
    const rows = await repos().dailyStats.recomputeDay(DAY);
    expect(val(rows, "arrived_patients")).toBe(3);
    expect(val(rows, "new_patients")).toBe(1);
    expect(val(rows, "returning_patients")).toBe(2);
    expect(val(rows, "appt_status", "arrived")).toBe(2);
    expect(val(rows, "appt_status", "completed")).toBe(1);
    expect(val(rows, "appt_status", "no_show")).toBe(1);
    expect(val(rows, "appt_status", "cancelled")).toBe(1);
    expect(val(rows, "billed_paise")).toBe(50_000);
    expect(val(rows, "collected_paise", STAT_DIM_NONE)).toBe(35_000);
    expect(val(rows, "collected_paise", "cash")).toBe(25_000);
    expect(val(rows, "collected_paise", "upi")).toBe(10_000);
    expect(val(rows, "procedure_count", "RCT")).toBe(2);
    expect(val(rows, "procedure_count", "Scaling")).toBe(1);
    expect(val(rows, "referral_count", "friend")).toBe(1);

    const again = await repos().dailyStats.recomputeDay(DAY);
    expect(val(again, "arrived_patients")).toBe(3);
    const live = t.sqlite
      .prepare(`SELECT count(*) AS n FROM daily_stats WHERE date_local = ? AND deleted_at IS NULL`)
      .get(DAY) as { n: number };
    const listed = await repos().dailyStats.listDay(DAY);
    expect(live.n).toBe(listed.length);
  });

  it("month roll-up matches the same hand totals for this one-day month", async () => {
    const rows = await repos().dailyStats.recomputeMonth(MONTH);
    expect(val(rows, "arrived_patients")).toBe(3);
    expect(val(rows, "new_patients")).toBe(1);
    expect(val(rows, "billed_paise")).toBe(50_000);
    expect(val(rows, "collected_paise", STAT_DIM_NONE)).toBe(35_000);
    expect(val(rows, "procedure_count", "RCT")).toBe(2);
  });

  it("receptionist cannot recompute", async () => {
    await expect(repos(receptionist).dailyStats.recomputeDay(DAY)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("recomputeRecentDays rate-limits the doctor button", async () => {
    const now = new Date("2026-11-15T12:00:00.000Z");
    await repos().dailyStats.recomputeRecentDays(now, { rateLimit: true, days: 1 });
    await expect(
      repos().dailyStats.recomputeRecentDays(new Date(now.getTime() + 1000), {
        rateLimit: true,
        days: 1,
      }),
    ).rejects.toThrow(/Wait/);
  });
});
