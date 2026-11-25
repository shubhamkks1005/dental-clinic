import { inChunks, paidByBill } from "./bills-paid";
import { billStateWord, isReadyToBill } from "@clinic/shared";
import { and, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import { bills, visits } from "../schema";

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

  // A week can hold more than 90 appointments, so ids go to D1 in chunks (S3.2.2).
  const finals = await inChunks(appointmentIds, (part) =>
    db
      .select({ id: visits.id, appointmentId: visits.appointmentId })
      .from(visits)
      .where(
        and(
          inArray(visits.appointmentId, part),
          sql`${visits.status} = 'final'`,
          isNull(visits.deletedAt),
        ),
      )
      .all(),
  );
  if (finals.length === 0) return out;

  const visitIds = finals.map((v) => v.id);
  const live = await inChunks(visitIds, (part) =>
    db
      .select({
        id: bills.id,
        visitId: bills.visitId,
        status: bills.status,
        total: bills.totalPaise,
      })
      .from(bills)
      .where(
        and(inArray(bills.visitId, part), ne(bills.status, "cancelled"), isNull(bills.deletedAt)),
      )
      .all(),
  );
  const paid = await paidByBill(
    db,
    live.map((b) => b.id),
  );

  for (const v of finals) {
    if (!v.appointmentId) continue;
    const bill = live.find((b) => b.visitId === v.id);
    const state = billStateWord(
      bill ? { status: bill.status, totalPaise: bill.total } : null,
      bill ? (paid.get(bill.id) ?? 0) : 0,
    );
    if (isReadyToBill(state)) out.set(v.appointmentId, { visitId: v.id, billId: bill?.id ?? null });
  }
  return out;
}
