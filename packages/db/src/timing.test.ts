import { describe, expect, it } from "vitest";
import { createDb } from "./client";
import { sql } from "drizzle-orm";
import { FakeD1, migratedSqlite } from "./testing";
import { serverTimingValue, timeD1 } from "./timing";
import type { D1Binding } from "./client";

function timed() {
  const { d1, timer } = timeD1(new FakeD1(migratedSqlite()) as unknown as D1Binding);
  return { db: createDb(d1), timer };
}

describe("D1 timing (S0.1.1)", () => {
  it("counts every query, and each statement of a batch", async () => {
    const { db, timer } = timed();
    await db.all(sql`SELECT 1`);
    await db.all(sql`SELECT 2`);
    expect(timer.queries).toBe(2);
    await db.batch([db.run(sql`SELECT 3`), db.run(sql`SELECT 4`), db.run(sql`SELECT 5`)]);
    expect(timer.queries).toBe(5);
    expect(timer.busyMs).toBeGreaterThanOrEqual(0);
  });

  it("two timers do not share counts (two requests in one isolate)", async () => {
    const a = timed();
    const b = timed();
    await a.db.all(sql`SELECT 1`);
    expect(a.timer.queries).toBe(1);
    expect(b.timer.queries).toBe(0);
  });

  it("formats numbers only, with no SQL", () => {
    const value = serverTimingValue(12.4, { queries: 3, busyMs: 4.6 });
    expect(value).toBe('total;dur=12, db;dur=5, queries;desc="3"');
  });
});
