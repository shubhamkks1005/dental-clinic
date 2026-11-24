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
  it("counts one round trip per query and per batch, and every statement apart", async () => {
    const { db, timer } = timed();
    await db.all(sql`SELECT 1`);
    await db.all(sql`SELECT 2`);
    expect(timer.queries).toBe(2);
    expect(timer.statements).toBe(2);
    await db.batch([db.run(sql`SELECT 3`), db.run(sql`SELECT 4`), db.run(sql`SELECT 5`)]);
    expect(timer.queries).toBe(3);
    expect(timer.statements).toBe(5);
    expect(timer.busyMs).toBeGreaterThanOrEqual(0);
  });

  it("a batch of 11 statements is 1 round trip and 11 statements", async () => {
    const { db, timer } = timed();
    const [first, ...rest] = Array.from({ length: 11 }, (_, i) => db.run(sql.raw(`SELECT ${i}`)));
    await db.batch([first!, ...rest]);
    expect(timer.queries).toBe(1);
    expect(timer.statements).toBe(11);
  });

  it("two timers do not share counts (two requests in one isolate)", async () => {
    const a = timed();
    const b = timed();
    await a.db.all(sql`SELECT 1`);
    expect(a.timer.queries).toBe(1);
    expect(b.timer.queries).toBe(0);
  });

  it("formats numbers only, with no SQL", () => {
    const value = serverTimingValue(12.4, { queries: 3, statements: 14, busyMs: 4.6 });
    expect(value).toBe('total;dur=12, db;dur=5, queries;desc="3", statements;desc="14"');
  });
});
