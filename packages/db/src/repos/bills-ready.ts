import { and, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import { bills, paymentAllocations, visits } from "../schema";

export type ReadyToBill = { visitId: string; billId: string | null };

/**
 * Appointments whose visit is finalised and not yet fully paid: no live bill, a draft bill,
 * or an issued bill with a balance. Keyed by appointment id.
 */
export async function readyToBillByAppointment(
  db: Db,
  appointmentIds: string[],
): Promise<Map<string, ReadyToBill>> {
  const out = new Map<string, ReadyToBill>();
  if (appointmentIds.length === 0) return out;

  const finals = await db
    .select({ id: visits.id, appointmentId: visits.appointmentId })
    .from(visits)
    .where(
      and(
        inArray(visits.appointmentId, appointmentIds),
        sql`${visits.status} = 'final'`,
        isNull(visits.deletedAt),
      ),
    )
    .all();
  if (finals.length === 0) return out;

  const visitIds = finals.map((v) => v.id);
  const live = await db
    .select({ id: bills.id, visitId: bills.visitId, status: bills.status, total: bills.totalPaise })
    .from(bills)
    .where(
      and(inArray(bills.visitId, visitIds), ne(bills.status, "cancelled"), isNull(bills.deletedAt)),
    )
    .all();
  const paidRows = await db
    .select({
      billId: paymentAllocations.billId,
      paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
    })
    .from(paymentAllocations)
    .where(
      and(
        inArray(
          paymentAllocations.billId,
          live.map((b) => b.id),
        ),
        isNull(paymentAllocations.deletedAt),
      ),
    )
    .groupBy(paymentAllocations.billId)
    .all();
  const paid = new Map(paidRows.map((r) => [r.billId, Number(r.paid)]));

  for (const v of finals) {
    if (!v.appointmentId) continue;
    const bill = live.find((b) => b.visitId === v.id);
    if (!bill) out.set(v.appointmentId, { visitId: v.id, billId: null });
    else if (bill.status === "draft" || bill.total - (paid.get(bill.id) ?? 0) > 0)
      out.set(v.appointmentId, { visitId: v.id, billId: bill.id });
  }
  return out;
}
