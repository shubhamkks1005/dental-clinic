import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import { paymentAllocations, payments, refunds } from "../schema";

export type AdvanceSlice = {
  paymentId: string;
  unallocatedPaise: number;
};

/** Patient credit = sum of payment leftovers after allocations and refunds. */
export async function patientAdvancePaise(db: Db, patientId: string): Promise<number> {
  const slices = await advanceSlices(db, patientId);
  return slices.reduce((s, x) => s + x.unallocatedPaise, 0);
}

/** Oldest-first payments that still have unallocated credit. */
export async function advanceSlices(db: Db, patientId: string): Promise<AdvanceSlice[]> {
  const pays = await db
    .select({
      id: payments.id,
      amountPaise: payments.amountPaise,
    })
    .from(payments)
    .where(and(eq(payments.patientId, patientId), isNull(payments.deletedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.createdAt))
    .all();
  if (pays.length === 0) return [];

  const ids = pays.map((p) => p.id);
  const allocRows = await db
    .select({
      paymentId: paymentAllocations.paymentId,
      used: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
    })
    .from(paymentAllocations)
    .where(and(inArray(paymentAllocations.paymentId, ids), isNull(paymentAllocations.deletedAt)))
    .groupBy(paymentAllocations.paymentId)
    .all();
  const refundRows = await db
    .select({
      paymentId: refunds.paymentId,
      used: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
    })
    .from(refunds)
    .where(and(inArray(refunds.paymentId, ids), isNull(refunds.deletedAt)))
    .groupBy(refunds.paymentId)
    .all();
  const allocMap = new Map(allocRows.map((r) => [r.paymentId, Number(r.used)]));
  const refundMap = new Map(refundRows.map((r) => [r.paymentId, Number(r.used)]));

  const out: AdvanceSlice[] = [];
  for (const p of pays) {
    const left = p.amountPaise - (allocMap.get(p.id) ?? 0) - (refundMap.get(p.id) ?? 0);
    if (left > 0) out.push({ paymentId: p.id, unallocatedPaise: left });
  }
  return out;
}
