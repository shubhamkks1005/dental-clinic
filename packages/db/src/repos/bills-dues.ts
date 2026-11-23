import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import { bills, paymentAllocations } from "../schema";

/** Outstanding on issued (non-cancelled) bills for a patient, oldest first. */
export async function openBillDues(
  db: Db,
  patientId: string,
): Promise<{ billId: string; duePaise: number; totalPaise: number }[]> {
  const open = await db
    .select({
      id: bills.id,
      totalPaise: bills.totalPaise,
      billOn: bills.billOn,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .where(and(eq(bills.patientId, patientId), eq(bills.status, "issued"), isNull(bills.deletedAt)))
    .orderBy(asc(bills.billOn), asc(bills.createdAt))
    .all();
  if (open.length === 0) return [];

  const ids = open.map((b) => b.id);
  const paidRows = await db
    .select({
      billId: paymentAllocations.billId,
      paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
    })
    .from(paymentAllocations)
    .where(and(inArray(paymentAllocations.billId, ids), isNull(paymentAllocations.deletedAt)))
    .groupBy(paymentAllocations.billId)
    .all();
  const paidMap = new Map(paidRows.map((r) => [r.billId, Number(r.paid)]));

  return open
    .map((b) => {
      const paid = paidMap.get(b.id) ?? 0;
      const duePaise = b.totalPaise - paid;
      return { billId: b.id, duePaise, totalPaise: b.totalPaise };
    })
    .filter((b) => b.duePaise > 0);
}
