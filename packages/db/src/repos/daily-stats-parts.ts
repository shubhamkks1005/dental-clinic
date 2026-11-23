import { STAT_DIM_NONE } from "@clinic/shared";
import { and, eq, isNotNull, isNull, like, sql } from "drizzle-orm";
import type { Db } from "../client";
import { patients, payments, refunds, visitProcedures, visits } from "../schema";

export type StatRow = { metric: string; dim: string; value: number };

function n(v: number | null | undefined): number {
  return Number(v ?? 0);
}

export async function appendCollected(
  db: Db,
  out: StatRow[],
  dayLocal: string | null,
  monthLocal: string | null,
) {
  const dayPred = dayLocal
    ? eq(payments.dayLocal, dayLocal)
    : like(payments.dayLocal, `${monthLocal}-%`);
  const payPrimary = await db
    .select({
      dim: payments.mode,
      value: sql<number>`coalesce(sum(${payments.amountPaise} - coalesce(${payments.splitPaise}, 0)), 0)`,
    })
    .from(payments)
    .where(and(dayPred, isNull(payments.deletedAt)))
    .groupBy(payments.mode)
    .all();
  const paySplit = await db
    .select({
      dim: payments.splitMode,
      value: sql<number>`coalesce(sum(${payments.splitPaise}), 0)`,
    })
    .from(payments)
    .where(and(dayPred, isNull(payments.deletedAt), isNotNull(payments.splitMode)))
    .groupBy(payments.splitMode)
    .all();

  const byMode = new Map<string, number>();
  for (const r of payPrimary) byMode.set(r.dim, n(r.value));
  for (const r of paySplit) {
    if (!r.dim) continue;
    byMode.set(r.dim, (byMode.get(r.dim) ?? 0) + n(r.value));
  }

  const refundDayExpr = sql`date(${refunds.approvedAt}, '+5 hours', '+30 minutes')`;
  const refundPred = dayLocal
    ? sql`${refundDayExpr} = ${dayLocal}`
    : sql`${refundDayExpr} like ${`${monthLocal}-%`}`;
  const refundRows = await db
    .select({
      dim: refunds.mode,
      value: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
    })
    .from(refunds)
    .where(and(isNull(refunds.deletedAt), refundPred))
    .groupBy(refunds.mode)
    .all();
  for (const r of refundRows) {
    byMode.set(r.dim, (byMode.get(r.dim) ?? 0) - n(r.value));
  }

  let total = 0;
  for (const [dim, value] of byMode) {
    out.push({ metric: "collected_paise", dim, value });
    total += value;
  }
  out.push({ metric: "collected_paise", dim: STAT_DIM_NONE, value: total });
}

export async function appendProcedures(
  db: Db,
  out: StatRow[],
  dayLocal: string | null,
  monthLocal: string | null,
) {
  const dayPred = dayLocal
    ? eq(visits.visitDateLocal, dayLocal)
    : like(visits.visitDateLocal, `${monthLocal}-%`);
  const rows = await db
    .select({
      dim: visitProcedures.label,
      value: sql<number>`count(*)`,
    })
    .from(visitProcedures)
    .innerJoin(visits, eq(visitProcedures.visitId, visits.id))
    .where(and(dayPred, isNull(visitProcedures.deletedAt), isNull(visits.deletedAt)))
    .groupBy(visitProcedures.label)
    .all();
  for (const r of rows) {
    out.push({ metric: "procedure_count", dim: r.dim, value: n(r.value) });
  }
}

export async function appendReferrals(
  db: Db,
  out: StatRow[],
  dayLocal: string | null,
  monthLocal: string | null,
) {
  const dayPred = dayLocal
    ? eq(patients.firstArrivedOn, dayLocal)
    : like(patients.firstArrivedOn, `${monthLocal}-%`);
  const rows = await db
    .select({
      dim: sql<string>`coalesce(${patients.referralSourceId}, 'unknown')`,
      value: sql<number>`count(*)`,
    })
    .from(patients)
    .where(and(dayPred, isNull(patients.legacyRef), isNull(patients.deletedAt)))
    .groupBy(sql`coalesce(${patients.referralSourceId}, 'unknown')`)
    .all();
  for (const r of rows) {
    out.push({ metric: "referral_count", dim: r.dim, value: n(r.value) });
  }
}
