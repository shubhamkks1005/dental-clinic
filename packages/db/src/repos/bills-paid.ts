import { and, desc, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import { paymentAllocations, payments, refunds } from "../schema";

/**
 * What each bill has really been paid: the money allocated to it MINUS what was refunded back.
 * Owner decision D1 (DECISIONS.md): a refund re-opens the due amount.
 *
 * A refund on a payment first takes the part of that payment that was never applied to a bill
 * (the advance, see advanceSlices), then reduces what the payment paid on bills, newest
 * allocation first. Allocation rows are never edited; this is the only place that applies refunds.
 */
export async function paidByBill(db: Db, billIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (billIds.length === 0) return out;

  const direct = await db
    .select({
      billId: paymentAllocations.billId,
      paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
    })
    .from(paymentAllocations)
    .where(and(inArray(paymentAllocations.billId, billIds), isNull(paymentAllocations.deletedAt)))
    .groupBy(paymentAllocations.billId)
    .all();
  for (const r of direct) out.set(r.billId, Number(r.paid));

  const touched = await db
    .selectDistinct({ paymentId: paymentAllocations.paymentId })
    .from(paymentAllocations)
    .where(and(inArray(paymentAllocations.billId, billIds), isNull(paymentAllocations.deletedAt)))
    .all();
  if (touched.length === 0) return out;
  const paymentIds = touched.map((t) => t.paymentId);

  const refunded = await db
    .select({
      paymentId: refunds.paymentId,
      sum: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
    })
    .from(refunds)
    .where(and(inArray(refunds.paymentId, paymentIds), isNull(refunds.deletedAt)))
    .groupBy(refunds.paymentId)
    .all();
  if (refunded.length === 0) return out;

  const refundIds = refunded.map((r) => r.paymentId);
  const pays = await db
    .select({ id: payments.id, amountPaise: payments.amountPaise })
    .from(payments)
    .where(inArray(payments.id, refundIds))
    .all();
  const amountOf = new Map(pays.map((p) => [p.id, p.amountPaise]));
  const allocs = await db
    .select({
      paymentId: paymentAllocations.paymentId,
      billId: paymentAllocations.billId,
      amountPaise: paymentAllocations.amountPaise,
    })
    .from(paymentAllocations)
    .where(
      and(inArray(paymentAllocations.paymentId, refundIds), isNull(paymentAllocations.deletedAt)),
    )
    .orderBy(desc(paymentAllocations.createdAt), desc(paymentAllocations.id))
    .all();

  for (const r of refunded) {
    const mine = allocs.filter((a) => a.paymentId === r.paymentId);
    const applied = mine.reduce((s, a) => s + a.amountPaise, 0);
    const advance = Math.max(0, (amountOf.get(r.paymentId) ?? 0) - applied);
    let toTake = Math.max(0, Number(r.sum) - advance);
    for (const a of mine) {
      if (toTake <= 0) break;
      const take = Math.min(a.amountPaise, toTake);
      toTake -= take;
      if (out.has(a.billId)) out.set(a.billId, (out.get(a.billId) ?? 0) - take);
    }
  }
  return out;
}
