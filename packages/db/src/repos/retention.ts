import { newUlid } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";

// 9.3.10: purge of OPERATIONAL rows only, exactly as docs/RETENTION.md decides.
// Patient, clinical, billing, consent, audit and access records are never touched here.
export const PURGE_ROW_LIMIT = 200;

type Rule = { table: string; days: number; where: string };

// message_outbox: only finished rows with no attempts left; attempts go first (they age out sooner).
export const RETENTION_RULES: readonly Rule[] = [
  { table: "message_attempts", days: 90, where: "1 = 1" },
  {
    table: "message_outbox",
    days: 365,
    where:
      "status NOT IN ('queued','held','sending') AND NOT EXISTS (SELECT 1 FROM message_attempts a WHERE a.outbox_id = message_outbox.id)",
  },
  { table: "error_log", days: 30, where: "1 = 1" },
  // Part T: the doctor's breaks are only a convenience record. Requests the doctor answered are kept
  // a year; refund requests stay (they belong with billing). DRAFT: owner / CA to confirm.
  { table: "doctor_breaks", days: 90, where: "1 = 1" },
  { table: "approval_requests", days: 365, where: "status != 'open' AND type != 'refund'" },
  // 0066: past leave days only matter for a while (the calendar shows them); kept 2 years.
  { table: "doctor_leaves", days: 730, where: "1 = 1" },
];

export type PurgeResult = {
  mode: "dry_run" | "live";
  tables: Array<{ table: string; eligible: number }>;
  total: number;
};

// Table names, days and conditions are constants in this file, never user input.
function eligibleText(rule: Rule, cutoff: string): string {
  return `SELECT id FROM ${rule.table} WHERE created_at < '${cutoff}' AND (${rule.where}) LIMIT ${PURGE_ROW_LIMIT}`;
}

const cutoffOf = (rule: Rule, now: Date) =>
  new Date(now.getTime() - rule.days * 86_400_000).toISOString();

export function retentionRepo(db: Db, ctx: Ctx) {
  return {
    /**
     * Dry run counts what would go; live really deletes (row limited per table per run).
     * One audit row per run, only when something was eligible (so a quiet system adds no rows).
     */
    async purge(now: Date, live: boolean): Promise<PurgeResult> {
      assertAllowed(ctx, "retention.run");
      const tables: PurgeResult["tables"] = [];
      for (const rule of RETENTION_RULES) {
        const rows = await db.all<{ id: string }>(sql.raw(eligibleText(rule, cutoffOf(rule, now))));
        tables.push({ table: rule.table, eligible: rows.length });
      }
      const total = tables.reduce((n, t) => n + t.eligible, 0);
      const result: PurgeResult = { mode: live ? "live" : "dry_run", tables, total };
      if (total === 0) return result;

      const deletes = live
        ? RETENTION_RULES.map((rule) =>
            db.run(
              sql.raw(
                `DELETE FROM ${rule.table} WHERE id IN (${eligibleText(rule, cutoffOf(rule, now))})`,
              ),
            ),
          )
        : [];
      await db.batch([
        ...deletes,
        auditInsert(db, ctx, {
          action: live ? "delete" : "create",
          table: "retention_run",
          rowId: newUlid(),
          before: null,
          after: result,
        }),
      ] as never);
      return result;
    },
  };
}
