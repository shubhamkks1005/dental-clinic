import { noShowPercent, STAT_DIM_NONE } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

function val(
  rows: { metric: string; dim: string; value: number }[],
  metric: string,
  dim = STAT_DIM_NONE,
) {
  return rows.find((r) => r.metric === metric && r.dim === dim)?.value ?? null;
}

beforeEach(() => {
  t = testDb();
});

describe("daily_stats edge numbers (6.2.5)", () => {
  it("IST 23:30 stays on that local day; UTC day alone would be wrong", async () => {
    // 2026-11-21 18:00 UTC = 2026-11-21 23:30 IST
    const at = "2026-11-21T18:00:00.000Z";
    const day = "2026-11-21";
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, first_arrived_on)
         VALUES ('p-late', 'system', 'system', 'P-000070', 'Fake Late', 'male', 28, '+919000000070', 'active', ?)`,
      )
      .run(day);
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook,
           arrived_at, version, updated_at
         ) VALUES (
           'a-late', 'system', 'system', 'p-late', '1', 'vt1', 'Consultation',
           ?, ?, 1410, 1440, 'arrived', 'phone', 'normal', 0, ?, 1, ?
         )`,
      )
      .run(at, day, at, at);
    t.sqlite
      .prepare(
        `INSERT INTO payments (
           id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local
         ) VALUES ('pay-late', 'system', 'system', 'p-late', 10000, 'cash', ?, 'doc-a', ?)`,
      )
      .run(at, day);

    const rows = await repos().dailyStats.recomputeDay(day);
    expect(val(rows, "arrived_patients")).toBe(1);
    expect(val(rows, "collected_paise")).toBe(10_000);
    // Neighbouring UTC calendar day must stay empty for this patient.
    const next = await repos().dailyStats.recomputeDay("2026-11-22");
    expect(val(next, "arrived_patients")).toBe(0);
  });

  it("legacy_ref patient is not new; walk-in no_show is excluded from no-show %", async () => {
    const day = "2026-11-18";
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, first_arrived_on, legacy_ref)
         VALUES
           ('p-leg', 'system', 'system', 'P-000071', 'Fake Legacy', 'female', 40, '+919000000071', 'active', ?, 'REG-9'),
           ('p-ph', 'system', 'system', 'P-000072', 'Fake Phone', 'male', 30, '+919000000072', 'active', '2026-10-01', NULL),
           ('p-wi', 'system', 'system', 'P-000073', 'Fake Walkin', 'female', 25, '+919000000073', 'active', '2026-10-02', NULL)`,
      )
      .run(day);

    const insert = (id: string, pid: string, status: string, source: string, startMin: number) => {
      t.sqlite
        .prepare(
          `INSERT INTO appointments (
             id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
             start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at, arrived_at
           ) VALUES (
             ?, 'system', 'system', ?, '1', 'vt1', 'Consultation',
             '2026-11-18T04:00:00.000Z', ?, ?, ?, ?, ?, 'normal', 0, 1, '2026-11-18T04:00:00.000Z',
             ?
           )`,
        )
        .run(
          id,
          pid,
          day,
          startMin,
          startMin + 30,
          status,
          source,
          status === "arrived" || status === "completed" ? "2026-11-18T04:00:00.000Z" : null,
        );
    };
    insert("a1", "p-leg", "arrived", "phone", 600);
    insert("a2", "p-ph", "no_show", "phone", 630);
    insert("a3", "p-wi", "no_show", "walk_in", 660);
    insert("a4", "p-ph", "arrived", "phone", 700);

    const rows = await repos().dailyStats.recomputeDay(day);
    expect(val(rows, "new_patients")).toBe(0); // only legacy first_arrived today
    expect(val(rows, "arrived_patients")).toBe(2); // p-leg + p-ph
    expect(val(rows, "noshow_count")).toBe(1); // phone no_show only
    expect(val(rows, "noshow_arrived")).toBe(2); // walk-in no_show excluded; both arrived are non-walk-in
    expect(noShowPercent(rows)).toBeCloseTo(1 / 3, 5);
  });

  it("refund reduces collected; cancelled bill is not billed", async () => {
    const day = "2026-11-19";
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES ('p-m', 'system', 'system', 'P-000074', 'Fake Money', 'female', 33, '+919000000074', 'active')`,
      )
      .run();
    t.sqlite
      .prepare(
        `INSERT INTO bills (
           id, created_by, updated_by, patient_id, bill_on, status, kind, total_paise, subtotal_paise
         ) VALUES
           ('b-ok', 'system', 'system', 'p-m', ?, 'issued', 'normal', 80000, 80000),
           ('b-x', 'system', 'system', 'p-m', ?, 'cancelled', 'normal', 20000, 20000)`,
      )
      .run(day, day);
    t.sqlite
      .prepare(
        `INSERT INTO payments (
           id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local
         ) VALUES ('pay-m', 'system', 'system', 'p-m', 50000, 'upi', '2026-11-19T05:00:00.000Z', 'doc-a', ?)`,
      )
      .run(day);
    t.sqlite
      .prepare(
        `INSERT INTO refunds (
           id, created_by, updated_by, payment_id, patient_id, amount_paise, mode, reason, approved_by, approved_at
         ) VALUES (
           'ref-m', 'system', 'system', 'pay-m', 'p-m', 15000, 'upi', 'Fake refund',
           'doc-a', '2026-11-19T06:00:00.000Z'
         )`,
      )
      .run();

    const rows = await repos().dailyStats.recomputeDay(day);
    expect(val(rows, "billed_paise")).toBe(80_000);
    expect(val(rows, "collected_paise", "upi")).toBe(35_000);
    expect(val(rows, "collected_paise")).toBe(35_000);
  });
});
