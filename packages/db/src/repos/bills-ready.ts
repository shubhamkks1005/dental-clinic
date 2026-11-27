import { inChunks, paidByBill } from "./bills-paid";
import { billStateWord, isReadyToBill } from "@clinic/shared";
import { and, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import { bills, visits } from "../schema";
import { rxDeskColumns, rxWaiting, type RxToPrint } from "./rx-desk-print";

export type ReadyToBill = { visitId: string; billId: string | null };

/**
 * Appointments whose visit is finalised and not yet fully paid: no live bill, a draft bill,
 * or an issued bill with a balance. Keyed by appointment id.
 */
export async function readyToBillByAppointment(
  db: Db,
  appointmentIds: string[],
): Promise<Map<string, ReadyToBill>> {
  return (await deskMarksByAppointment(db, appointmentIds)).ready;
}

/**
 * The desk's two marks from the same visits read (no extra query, S3.2.1): ready to bill, and the
 * prescription the doctor passed to the desk to print (visit finished, owner 2026-11-27).
 */
export async function deskMarksByAppointment(
  db: Db,
  appointmentIds: string[],
): Promise<{ ready: Map<string, ReadyToBill>; rxToPrint: Map<string, RxToPrint> }> {
  const out = new Map<string, ReadyToBill>();
  const rxToPrint = new Map<string, RxToPrint>();
  if (appointmentIds.length === 0) return { ready: out, rxToPrint };

  // A week can hold more than 90 appointments, so ids go to D1 in chunks (S3.2.2).
  const finals = await inChunks(appointmentIds, (part) =>
    db
      .select({
        id: visits.id,
        appointmentId: visits.appointmentId,
        ...rxDeskColumns(sql`${visits.id}`),
      })
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
  for (const v of finals) {
    const rx = rxWaiting(v);
    if (v.appointmentId && rx) rxToPrint.set(v.appointmentId, rx);
  }
  if (finals.length === 0) return { ready: out, rxToPrint };

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
  return { ready: out, rxToPrint };
}
