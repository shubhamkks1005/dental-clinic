import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type D1Binding } from "../client";
import type { Ctx } from "../context";
import { FakeD1, migratedSqlite } from "../testing";
import { computeDayStatRows } from "./daily-stats-queries";
import { createRepos } from "./index";

// S1.1 / S1.2.1: how many D1 calls the stats code makes. A db.batch is ONE round trip (PLAN Part S),
// but the Server-Timing counter (timing.ts) counts each statement of a batch, so both are checked.
// Before S1.1 the same dashboard call was 63 round trips and recomputeRecentDays 48.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const NOW = new Date("2026-11-23T06:30:00.000Z");

type Stmt = Parameters<FakeD1["batch"]>[0];

class CountingD1 extends FakeD1 {
  batches = 0;
  batched = 0;
  statements = 0;
  ran: { sql: string; params: unknown[] }[] = [];
  constructor(sqlite: DatabaseSync) {
    super(sqlite, (sql, params) => {
      this.statements++;
      this.ran.push({ sql, params });
    });
  }
  override async batch(statements: Stmt) {
    this.batches++;
    this.batched += statements.length;
    return super.batch(statements);
  }
}

function setup() {
  const sqlite = migratedSqlite();
  const d1 = new CountingD1(sqlite);
  const db = createDb(d1 as unknown as D1Binding);
  const reset = () => {
    d1.batches = 0;
    d1.batched = 0;
    d1.statements = 0;
    d1.ran.length = 0;
  };
  const counts = () => ({
    statements: d1.statements,
    roundTrips: d1.batches + (d1.statements - d1.batched),
  });
  return { sqlite, db, reset, counts, ran: d1.ran };
}

let t: ReturnType<typeof setup>;
beforeEach(() => {
  t = setup();
});

function seedStored() {
  t.sqlite
    .prepare(
      "INSERT INTO daily_stats (id, created_by, updated_by, date_local, metric, dim, value) VALUES ('d1', 's', 's', '2026-11-22', 'arrived_patients', '', 7)",
    )
    .run();
  const m = t.sqlite.prepare(
    "INSERT INTO monthly_stats (id, created_by, updated_by, month_local, metric, dim, value) VALUES (?, 's', 's', '2026-10', ?, '', ?)",
  );
  m.run("m1", "new_patients", 11);
  m.run("m2", "collected_paise", 123_000);
}

describe("stats query counts (S1.1, S1.2.1)", () => {
  it("one day is ONE read round trip of 11 statements", async () => {
    t.reset();
    await computeDayStatRows(t.db, "2026-11-20");
    expect(t.counts()).toEqual({ statements: 11, roundTrips: 1 });
  });

  it("dashboard: stored yesterday and last month are read, not recomputed", async () => {
    seedStored();
    t.reset();
    const dash = await createRepos(t.db, doctor).dashboard.get(
      { range: "this_month", compare: "1" },
      NOW,
    );
    expect(dash.kpis.prevTodayArrived).toBe(7);
    expect(dash.kpis.prevMonthNew).toBe(11);
    expect(dash.kpis.prevMonthCollectedPaise).toBe(123_000);
    const c = t.counts();
    // stored cells (2) + today (1) + this month (1) + KPI reads (1) + side reads (1)
    expect(c.roundTrips).toBeLessThanOrEqual(6);
    expect(c.statements).toBeLessThanOrEqual(35);
  });

  it("dashboard: nothing stored, so yesterday and last month are computed as before", async () => {
    t.reset();
    const dash = await createRepos(t.db, doctor).dashboard.get({ range: "this_month" }, NOW);
    expect(dash.kpis.prevTodayArrived).toBe(0);
    expect(t.counts().roundTrips).toBeLessThanOrEqual(10);
  });

  it("dashboard: today is computed once, not once for the cells and once for the KPIs", async () => {
    seedStored();
    t.reset();
    await createRepos(t.db, doctor).dashboard.get({ range: "this_month" }, NOW);
    // today's range is [2026-11-23, 2026-11-24); each full compute has 2 "count(distinct" statements
    const today = t.ran.filter(
      (s) =>
        s.sql.includes("count(distinct") &&
        s.params.includes("2026-11-23") &&
        s.params.includes("2026-11-24"),
    );
    expect(today).toHaveLength(2);
  });

  it("recomputeRecentDays (3 days + month) is far below 50 round trips", async () => {
    t.reset();
    await createRepos(t.db, doctor).dailyStats.recomputeRecentDays(NOW, { rateLimit: false });
    // 3 days x (1 read batch + 1 write batch) + 1 month x 2
    expect(t.counts().roundTrips).toBeLessThanOrEqual(8);
  });
});
