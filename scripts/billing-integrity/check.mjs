#!/usr/bin/env node
// 5.4.1: re-add billing money with SQL aggregates (no Worker CPU).
// Usage: node scripts/billing-integrity/check.mjs path/to/export.sql
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * @param {import("node:sqlite").DatabaseSync} db
 * @returns {{ ok: true } | { ok: false, problems: string[] }}
 */
export function checkBillingIntegrity(db) {
  const problems = [];

  const billPaid = db
    .prepare(
      `SELECT b.id AS bill_id, b.total_paise,
              coalesce((SELECT sum(a.amount_paise) FROM payment_allocations a
                        WHERE a.bill_id = b.id AND a.deleted_at IS NULL), 0) AS paid
       FROM bills b
       WHERE b.deleted_at IS NULL AND b.status = 'issued'`,
    )
    .all();
  for (const row of billPaid) {
    if (Number(row.paid) > Number(row.total_paise)) {
      problems.push(`bill ${row.bill_id}: paid ${row.paid} > total ${row.total_paise}`);
    }
  }

  const payRows = db
    .prepare(
      `SELECT p.id AS payment_id, p.amount_paise,
              coalesce((SELECT sum(a.amount_paise) FROM payment_allocations a
                        WHERE a.payment_id = p.id AND a.deleted_at IS NULL), 0) AS allocated,
              coalesce((SELECT sum(r.amount_paise) FROM refunds r
                        WHERE r.payment_id = p.id AND r.deleted_at IS NULL), 0) AS refunded
       FROM payments p
       WHERE p.deleted_at IS NULL`,
    )
    .all();
  for (const row of payRows) {
    if (Number(row.allocated) + Number(row.refunded) > Number(row.amount_paise)) {
      problems.push(
        `payment ${row.payment_id}: allocated+refunded ${Number(row.allocated) + Number(row.refunded)} > amount ${row.amount_paise}`,
      );
    }
  }

  // Patient due = sum(issued total − allocations) must be ≥ 0.
  const dues = db
    .prepare(
      `SELECT b.patient_id,
              sum(b.total_paise - coalesce((
                SELECT sum(a.amount_paise) FROM payment_allocations a
                WHERE a.bill_id = b.id AND a.deleted_at IS NULL), 0)) AS due
       FROM bills b
       WHERE b.deleted_at IS NULL AND b.status = 'issued'
       GROUP BY b.patient_id`,
    )
    .all();
  for (const row of dues) {
    if (Number(row.due) < 0) {
      problems.push(`patient ${row.patient_id}: negative due ${row.due}`);
    }
  }

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

export function checkDumpSql(sql) {
  const path = join(tmpdir(), `clinic-billing-check-${process.pid}-${Date.now()}.db`);
  const db = new DatabaseSync(path);
  try {
    db.exec(sql);
    return checkBillingIntegrity(db);
  } finally {
    db.close();
    try {
      unlinkSync(path);
    } catch {
      /* ignore */
    }
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/billing-integrity/check.mjs path/to/export.sql");
    process.exit(2);
  }
  const result = checkDumpSql(readFileSync(file, "utf8"));
  if (!result.ok) {
    console.error(JSON.stringify(result));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true }));
}
