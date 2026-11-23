import type { DatabaseSync } from "node:sqlite";
import { createDb, type D1Binding, type Db } from "../client";
import { FakeD1 } from "./fake-d1";
import { migratedSqlite } from "./test-db";

// Query-plan guard (1.2.8). D1 free allows 5 million rows read per day, so a hot query must never
// read a whole growing table. Only these tables stay small (a few staff, settings keys, counters);
// every other table, including any new one, must be reached through an index.
export const SMALL_TABLES = new Set(["users", "settings", "counters", "ops_status"]);

export type RanStatement = { sql: string; params: unknown[] };

// A test database that remembers every statement it runs.
export function recordingDb(): { db: Db; sqlite: DatabaseSync; ran: RanStatement[] } {
  const sqlite = migratedSqlite();
  const ran: RanStatement[] = [];
  const d1 = new FakeD1(sqlite, (sql, params) => ran.push({ sql, params }));
  return { db: createDb(d1 as unknown as D1Binding), sqlite, ran };
}

export function queryPlan(sqlite: DatabaseSync, sql: string, params: unknown[] = []): string[] {
  const rows = sqlite.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...(params as never[]));
  return rows.map((row) => String(row.detail));
}

// Plan lines that read a whole big table, e.g. "SCAN audit_log" (also a full index scan).
export function fullScans(plan: string[]): string[] {
  return plan.filter((line) => {
    const table = /^SCAN (\w+)/.exec(line)?.[1];
    return table !== undefined && table !== "CONSTANT" && !SMALL_TABLES.has(table);
  });
}

export function scansIn(sqlite: DatabaseSync, ran: RanStatement[]): string[] {
  return ran.flatMap(({ sql, params }) =>
    fullScans(queryPlan(sqlite, sql, params)).map((line) => `${line}  <-  ${sql}`),
  );
}
