import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { checkBillingIntegrity } from "./check.mjs";

function emptyBillingDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE bills (
      id TEXT PRIMARY KEY, patient_id TEXT, total_paise INTEGER, status TEXT, deleted_at TEXT
    );
    CREATE TABLE payment_allocations (
      id TEXT PRIMARY KEY, bill_id TEXT, payment_id TEXT, amount_paise INTEGER, deleted_at TEXT
    );
    CREATE TABLE payments (
      id TEXT PRIMARY KEY, amount_paise INTEGER, deleted_at TEXT
    );
    CREATE TABLE refunds (
      id TEXT PRIMARY KEY, payment_id TEXT, amount_paise INTEGER, deleted_at TEXT
    );
  `);
  return db;
}

describe("billing integrity (5.4.1)", () => {
  it("passes a consistent fake ledger", () => {
    const db = emptyBillingDb();
    db.exec(`
      INSERT INTO bills VALUES ('b1','p1',10000,'issued',NULL);
      INSERT INTO payments VALUES ('pay1',10000,NULL);
      INSERT INTO payment_allocations VALUES ('a1','b1','pay1',10000,NULL);
    `);
    expect(checkBillingIntegrity(db)).toEqual({ ok: true });
  });

  it("fails when an intentional over-allocation is present", () => {
    const db = emptyBillingDb();
    db.exec(`
      INSERT INTO bills VALUES ('b1','p1',10000,'issued',NULL);
      INSERT INTO payments VALUES ('pay1',5000,NULL);
      INSERT INTO payment_allocations VALUES ('a1','b1','pay1',9000,NULL);
    `);
    const result = checkBillingIntegrity(db);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems.some((p) => p.includes("payment pay1"))).toBe(true);
    }
  });
});
