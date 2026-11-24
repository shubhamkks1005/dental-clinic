import { and, desc, inArray, isNull, sql, type SQL } from "drizzle-orm";
import type { Db } from "../client";
import { paymentAllocations, payments, refunds } from "../schema";

/** D1 allows 100 bound values per query; stay well under it (S1.3.2). */
const IN_CHUNK = 90;

export async function inChunks<T, R>(items: T[], run: (part: T[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += IN_CHUNK) {
    out.push(...(await run(items.slice(i, i + IN_CHUNK))));
  }
  return out;
}

/**
 * Same refund rule as paidByBill, but as one SQL fragment with no id list: one row per issued bill
 * with its total and what it has really been paid. Used by the dues list (S1.3.1).
 * Window sum "before" = allocations of the same payment that are newer than this one.
 */
export function issuedBillPaidSql(): SQL {
  return sql`
    WITH refunded AS (
      SELECT payment_id, SUM(amount_paise) AS r FROM refunds
      WHERE deleted_at IS NULL GROUP BY payment_id
    ),
    ral AS (
      SELECT a.bill_id AS bill_id, a.amount_paise AS amt,
        SUM(a.amount_paise) OVER (PARTITION BY a.payment_id) AS applied,
        COALESCE(SUM(a.amount_paise) OVER (
          PARTITION BY a.payment_id ORDER BY a.created_at DESC, a.id DESC
          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS newer,
        a.payment_id AS payment_id
      FROM payment_allocations a
      WHERE a.deleted_at IS NULL AND a.payment_id IN (SELECT payment_id FROM refunded)
    ),
    taken AS (
      SELECT ral.bill_id AS bill_id,
        MAX(0, MIN(ral.amt, MAX(0, rf.r - MAX(0, p.amount_paise - ral.applied)) - ral.newer)) AS t
      FROM ral
      JOIN refunded rf ON rf.payment_id = ral.payment_id
      JOIN payments p ON p.id = ral.payment_id
    ),
    taken_by_bill AS (SELECT bill_id, SUM(t) AS t FROM taken GROUP BY bill_id),
    paid_by_bill AS (
      SELECT bill_id, SUM(amount_paise) AS paid FROM payment_allocations
      WHERE deleted_at IS NULL GROUP BY bill_id
    ),
    open_bills AS (
      SELECT b.id AS id, b.patient_id AS patient_id, b.bill_on AS bill_on,
        b.total_paise - (COALESCE(pb.paid, 0) - COALESCE(tb.t, 0)) AS due
      FROM bills b
      LEFT JOIN paid_by_bill pb ON pb.bill_id = b.id
      LEFT JOIN taken_by_bill tb ON tb.bill_id = b.id
      WHERE b.status = 'issued' AND b.deleted_at IS NULL
    )`;
}

/**
 * What each bill has really been paid: the money allocated to it MINUS what was refunded back.
 * Owner decision D1 (DECISIONS.md): a refund re-opens the due amount.
 *
 * A refund on a payment first takes the part of that payment that was never applied to a bill
 * (the advance, see advanceSlices), then reduces what the payment paid on bills, newest
 * allocation first. Allocation rows are never edited; this is the only place that applies refunds.
 * Keep issuedBillPaidSql in step with this function (a test compares them).
 */
export async function paidByBill(db: Db, billIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (billIds.length === 0) return out;

  const direct = await inChunks(billIds, (part) =>
    db
      .select({
        billId: paymentAllocations.billId,
        paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
      })
      .from(paymentAllocations)
      .where(and(inArray(paymentAllocations.billId, part), isNull(paymentAllocations.deletedAt)))
      .groupBy(paymentAllocations.billId)
      .all(),
  );
  for (const r of direct) out.set(r.billId, Number(r.paid));

  const touched = await inChunks(billIds, (part) =>
    db
      .selectDistinct({ paymentId: paymentAllocations.paymentId })
      .from(paymentAllocations)
      .where(and(inArray(paymentAllocations.billId, part), isNull(paymentAllocations.deletedAt)))
      .all(),
  );
  if (touched.length === 0) return out;
  const paymentIds = [...new Set(touched.map((t) => t.paymentId))];

  const refunded = await inChunks(paymentIds, (part) =>
    db
      .select({
        paymentId: refunds.paymentId,
        sum: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
      })
      .from(refunds)
      .where(and(inArray(refunds.paymentId, part), isNull(refunds.deletedAt)))
      .groupBy(refunds.paymentId)
      .all(),
  );
  if (refunded.length === 0) return out;

  const refundIds = refunded.map((r) => r.paymentId);
  const pays = await inChunks(refundIds, (part) =>
    db
      .select({ id: payments.id, amountPaise: payments.amountPaise })
      .from(payments)
      .where(inArray(payments.id, part))
      .all(),
  );
  const amountOf = new Map(pays.map((p) => [p.id, p.amountPaise]));
  const allocs = await inChunks(refundIds, (part) =>
    db
      .select({
        paymentId: paymentAllocations.paymentId,
        billId: paymentAllocations.billId,
        amountPaise: paymentAllocations.amountPaise,
      })
      .from(paymentAllocations)
      .where(and(inArray(paymentAllocations.paymentId, part), isNull(paymentAllocations.deletedAt)))
      .orderBy(desc(paymentAllocations.createdAt), desc(paymentAllocations.id))
      .all(),
  );

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
