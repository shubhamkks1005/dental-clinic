import { STAT_DIM_NONE } from "@clinic/shared";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import { patients, payments, refunds, visitProcedures, visits } from "../schema";
import { inDays, inUtc, type StatPeriod } from "./stats-range";

export type StatRow = { metric: string; dim: string; value: number };

function n(v: number | null | undefined): number {
  return Number(v ?? 0);
}

// S1.1.1: each function below only BUILDS queries (not run) so the caller can send them in one
// db.batch. The *Rows functions turn the batch results into StatRow lists.

export function collectedQueries(db: Db, p: StatPeriod) {
  const primary = db
    .select({
      dim: payments.mode,
      value: sql<number>`coalesce(sum(${payments.amountPaise} - coalesce(${payments.splitPaise}, 0)), 0)`,
    })
    .from(payments)
    .where(and(inDays(payments.dayLocal, p), isNull(payments.deletedAt)))
    .groupBy(payments.mode);
  const split = db
    .select({
      dim: payments.splitMode,
      value: sql<number>`coalesce(sum(${payments.splitPaise}), 0)`,
    })
    .from(payments)
    .where(
      and(inDays(payments.dayLocal, p), isNull(payments.deletedAt), isNotNull(payments.splitMode)),
    )
    .groupBy(payments.splitMode);
  // S2.2.2: approved_at is UTC ISO text, so the IST period is a UTC range (no date() per row).
  const refund = refundsByMode(db, p);
  return [primary, split, refund] as const;
}

export function refundsByMode(db: Db, p: StatPeriod) {
  return db
    .select({
      dim: refunds.mode,
      value: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
    })
    .from(refunds)
    .where(and(isNull(refunds.deletedAt), inUtc(refunds.approvedAt, p)))
    .groupBy(refunds.mode);
}

type ModeRow = { dim: string | null; value: number };

export function collectedRows(primary: ModeRow[], split: ModeRow[], refundRows: ModeRow[]) {
  const byMode = new Map<string, number>();
  for (const r of primary) byMode.set(r.dim ?? "", n(r.value));
  for (const r of split) {
    if (!r.dim) continue;
    byMode.set(r.dim, (byMode.get(r.dim) ?? 0) + n(r.value));
  }
  for (const r of refundRows) {
    byMode.set(r.dim ?? "", (byMode.get(r.dim ?? "") ?? 0) - n(r.value));
  }
  const out: StatRow[] = [];
  let total = 0;
  for (const [dim, value] of byMode) {
    out.push({ metric: "collected_paise", dim, value });
    total += value;
  }
  out.push({ metric: "collected_paise", dim: STAT_DIM_NONE, value: total });
  return out;
}

export function proceduresQuery(db: Db, p: StatPeriod) {
  return db
    .select({ dim: visitProcedures.label, value: sql<number>`count(*)` })
    .from(visitProcedures)
    .innerJoin(visits, eq(visitProcedures.visitId, visits.id))
    .where(
      and(
        inDays(visits.visitDateLocal, p),
        isNull(visitProcedures.deletedAt),
        isNull(visits.deletedAt),
      ),
    )
    .groupBy(visitProcedures.label);
}

export function proceduresRows(rows: { dim: string; value: number }[]): StatRow[] {
  return rows.map((r) => ({ metric: "procedure_count", dim: r.dim, value: n(r.value) }));
}

export function referralsQuery(db: Db, p: StatPeriod) {
  return db
    .select({
      dim: sql<string>`coalesce(${patients.referralSourceId}, 'unknown')`,
      value: sql<number>`count(*)`,
    })
    .from(patients)
    .where(
      and(
        inDays(patients.firstArrivedOn, p),
        isNull(patients.legacyRef),
        isNull(patients.deletedAt),
      ),
    )
    .groupBy(sql`coalesce(${patients.referralSourceId}, 'unknown')`);
}

export function referralsRows(rows: { dim: string; value: number }[]): StatRow[] {
  return rows.map((r) => ({ metric: "referral_count", dim: r.dim, value: n(r.value) }));
}
