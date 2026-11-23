import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkDumpSql } from "./integrity.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const migrations = join(here, "../../packages/db/migrations");

describe("backup integrity (1.6.3 / 9.1.3)", () => {
  it("accepts a dump built from our migrations", () => {
    const sql = readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(migrations, f), "utf8"))
      .join("\n");
    const result = checkDumpSql(sql);
    expect(result.tables).toEqual(
      expect.arrayContaining(["users", "settings", "list_items", "bills"]),
    );
    expect(result.billingOk).toBe(true);
  });

  it("accepts the FAKE fixture dump", () => {
    const sql = readFileSync(join(here, "fixture-dump.sql"), "utf8");
    const result = checkDumpSql(sql);
    expect(result.tables).toEqual(expect.arrayContaining(["users", "files"]));
  });

  it("refuses a dump with no tables", () => {
    expect(() => checkDumpSql("SELECT 1;")).toThrow(/missing tables/i);
  });

  it("refuses a dump that fails billing invariants", () => {
    const base = readFileSync(join(here, "fixture-dump.sql"), "utf8");
    const bad = `${base}
CREATE TABLE bills (
  id TEXT PRIMARY KEY, patient_id TEXT, status TEXT, total_paise INTEGER, deleted_at TEXT
);
CREATE TABLE payments (
  id TEXT PRIMARY KEY, amount_paise INTEGER, deleted_at TEXT
);
CREATE TABLE payment_allocations (
  id TEXT PRIMARY KEY, bill_id TEXT, payment_id TEXT, amount_paise INTEGER, deleted_at TEXT
);
CREATE TABLE refunds (
  id TEXT PRIMARY KEY, payment_id TEXT, amount_paise INTEGER, deleted_at TEXT
);
INSERT INTO bills VALUES('b1','p1','issued',100,NULL);
INSERT INTO payments VALUES('pay1',50,NULL);
INSERT INTO payment_allocations VALUES('a1','b1','pay1',200,NULL);
`;
    expect(() => checkDumpSql(bad)).toThrow(/billing integrity/i);
  });
});
