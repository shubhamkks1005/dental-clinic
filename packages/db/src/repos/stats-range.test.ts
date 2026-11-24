import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { fullScans, queryPlan, recordingDb, testDb } from "../testing";
import { collectedQueries, referralsQuery } from "./daily-stats-parts";
import { createRepos } from "./index";
import { addMonthsYm, dayPeriod, monthPeriod } from "./stats-range";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

describe("stats date ranges (S2.2)", () => {
  it("month math rolls over the year", () => {
    expect(addMonthsYm("2026-12", 1)).toBe("2027-01");
    expect(addMonthsYm("2026-01", -1)).toBe("2025-12");
    expect(monthPeriod("2026-12")).toMatchObject({ dayFrom: "2026-12-01", dayTo: "2027-01-01" });
    expect(monthPeriod("2026-02")).toMatchObject({ dayFrom: "2026-02-01", dayTo: "2026-03-01" });
  });

  it("an IST period is a UTC range that starts at 18:30 the evening before", () => {
    expect(dayPeriod("2026-11-15")).toEqual({
      dayFrom: "2026-11-15",
      dayTo: "2026-11-16",
      utcFrom: "2026-11-14T18:30:00.000Z",
      utcTo: "2026-11-15T18:30:00.000Z",
    });
    const m = monthPeriod("2026-11");
    expect(m.utcFrom).toBe("2026-10-31T18:30:00.000Z");
    expect(m.utcTo).toBe("2026-11-30T18:30:00.000Z");
  });

  describe("queries", () => {
    let t: ReturnType<typeof testDb>;
    beforeEach(() => {
      t = testDb();
    });
    const plan = (q: { toSQL(): { sql: string; params: unknown[] } }) => {
      const s = q.toSQL();
      return queryPlan(t.sqlite, s.sql, s.params);
    };

    // visits (visit_date_local) and refunds (approved_at) have no index that starts with that
    // column, so their plans still scan: that needs a migration, not a query change (see STATE).
    it("payments and patients use their date index with a range (no scan)", () => {
      const p = monthPeriod("2026-11");
      const [primary, split] = collectedQueries(t.db, p);
      for (const q of [primary, split]) {
        expect(plan(q).join(" ")).toContain(
          "USING INDEX payments_day_local_idx (day_local>? AND day_local<?)",
        );
        expect(fullScans(plan(q))).toEqual([]);
      }
      const ref = plan(referralsQuery(t.db, p));
      expect(ref.join(" ")).toContain(
        "USING INDEX patients_first_arrived_on_idx (first_arrived_on>? AND first_arrived_on<?)",
      );
      expect(fullScans(ref)).toEqual([]);
    });

    it("appointments use the (date_local, status) index with a range", () => {
      const p = monthPeriod("2026-11");
      const lines = queryPlan(
        t.sqlite,
        "SELECT count(*) FROM appointments WHERE date_local >= ? AND date_local < ? AND deleted_at IS NULL",
        [p.dayFrom, p.dayTo],
      );
      expect(lines.join(" ")).toMatch(/appointments_day_(status|queue)_idx/);
      expect(fullScans(lines)).toEqual([]);
    });

    it("no stats statement uses LIKE or date() any more", async () => {
      const r = recordingDb();
      await createRepos(r.db, doctor).dailyStats.recomputeMonth("2026-11");
      const sqls = r.ran.map((s) => s.sql.toLowerCase());
      expect(sqls.length).toBeGreaterThan(10);
      expect(sqls.filter((s) => / like /.test(s) || s.includes("date("))).toEqual([]);
    });
  });

  describe("month edges", () => {
    let t: ReturnType<typeof testDb>;
    beforeEach(() => {
      t = testDb();
      t.sqlite
        .prepare(
          `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
           VALUES ('p', 's', 's', 'P-000001', 'Fake Edge', 'female', 30, '+919000000001', 'active')`,
        )
        .run();
      const pay = t.sqlite.prepare(
        `INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local)
         VALUES (?, 's', 's', 'p', ?, 'cash', '2026-11-01T05:00:00.000Z', 'doc-a', ?)`,
      );
      pay.run("pay-oct", 1000, "2026-10-31");
      pay.run("pay-nov1", 2000, "2026-11-01");
      pay.run("pay-nov30", 4000, "2026-11-30");
      pay.run("pay-dec1", 8000, "2026-12-01");
      const ref = t.sqlite.prepare(
        `INSERT INTO refunds (id, created_by, updated_by, payment_id, patient_id, amount_paise, mode, reason, approved_by, approved_at)
         VALUES (?, 's', 's', 'pay-nov1', 'p', ?, 'cash', 'Fake', 'doc-a', ?)`,
      );
      // IST Oct 31 23:59:59.999, IST Nov 1 00:00:00, IST Nov 30 23:59:59.999, IST Dec 1 00:00.
      ref.run("r-oct", 1, "2026-10-31T18:29:59.999Z");
      ref.run("r-nov1", 10, "2026-10-31T18:30:00.000Z");
      ref.run("r-nov30", 100, "2026-11-30T18:29:59.999Z");
      ref.run("r-dec1", 1000, "2026-11-30T18:30:00.000Z");
    });

    it("payments and refunds count only inside the IST month (first and last instant)", async () => {
      const rows = await createRepos(t.db, doctor).dailyStats.recomputeMonth("2026-11");
      const total = rows.find((r) => r.metric === "collected_paise" && r.dim === "")?.value;
      // payments 2000 + 4000, refunds 10 + 100
      expect(total).toBe(6000 - 110);
    });

    it("a day's refund uses the IST day, not the UTC day", async () => {
      const rows = await createRepos(t.db, doctor).dailyStats.recomputeDay("2026-11-01");
      // payment 2000 that day; refund r-nov1 (IST 00:00 on Nov 1) is 10
      expect(rows.find((r) => r.metric === "collected_paise" && r.dim === "")?.value).toBe(1990);
    });
  });
});
