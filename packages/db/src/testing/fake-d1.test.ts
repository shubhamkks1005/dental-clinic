import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb, type D1Binding } from "../client";
import { D1_MAX_BOUND_VALUES, FakeD1, migratedSqlite } from "./index";

// S0.1.3: a query with more than 100 bound values must fail in tests, as it does on real D1.
function inList(count: number) {
  const db = createDb(new FakeD1(migratedSqlite()) as unknown as D1Binding);
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  return db.all(sql`SELECT id FROM patients WHERE id IN (${sql.join(ids, sql`, `)})`);
}

describe("FakeD1 bound-value guard", () => {
  it("allows exactly 100 values", async () => {
    expect(D1_MAX_BOUND_VALUES).toBe(100);
    await expect(inList(100)).resolves.toEqual([]);
  });

  it("throws on 101 values", async () => {
    // drizzle wraps the driver error as "Failed query"; the real reason is its cause.
    const error = await inList(101).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String((error as Error).cause)).toMatch(/at most 100 bound values.*got 101/);
  });
});
