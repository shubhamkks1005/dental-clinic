import { newUlid } from "@clinic/shared";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { prescriptions, printLog } from "../schema";

// Visit finished (owner 2026-11-27, review Q1): the doctor passes an issued prescription to the
// desk to print. An issued prescription is never updated, so the request is a print_log row of its
// own kind (it is not a print: the desk's print stays the "original", not a "Duplicate copy").
export const DESK_REQUEST_KIND = "prescription_desk_request";

export type RxToPrint = { prescriptionId: string; rxNo: string | null; requestedAt: string };

/** Latest issued prescription of a visit row, with its last desk request and last print. */
export function rxDeskColumns(visitIdCol: ReturnType<typeof sql>) {
  const latestRx = sql`(SELECT p.id FROM prescriptions p WHERE p.visit_id = ${visitIdCol}
    AND p.status IN ('issued', 'revised') AND p.deleted_at IS NULL
    ORDER BY p.issued_at DESC LIMIT 1)`;
  return {
    rxId: sql<string | null>`${latestRx}`,
    rxNo: sql<string | null>`(SELECT p.rx_no FROM prescriptions p WHERE p.id = ${latestRx})`,
    rxAsked: sql<string | null>`(SELECT max(pl.printed_at) FROM print_log pl
      WHERE pl.document_kind = ${DESK_REQUEST_KIND} AND pl.document_id = ${latestRx}
      AND pl.deleted_at IS NULL)`,
    rxPrinted: sql<string | null>`(SELECT max(pl.printed_at) FROM print_log pl
      WHERE pl.document_kind = 'prescription' AND pl.document_id = ${latestRx}
      AND pl.deleted_at IS NULL)`,
  };
}

/** Waiting at the desk = asked and not printed since. */
export function rxWaiting(r: {
  rxId: string | null;
  rxNo: string | null;
  rxAsked: string | null;
  rxPrinted: string | null;
}): RxToPrint | null {
  if (!r.rxId || !r.rxAsked) return null;
  if (r.rxPrinted && r.rxPrinted >= r.rxAsked) return null;
  return { prescriptionId: r.rxId, rxNo: r.rxNo, requestedAt: r.rxAsked };
}

export function rxDeskPrintRepo(db: Db, ctx: Ctx) {
  return {
    /** Doctor: ask the desk to print. A second tap while it is still waiting is a no-op. */
    async requestDeskPrint(prescriptionId: string): Promise<{ requestedAt: string }> {
      assertAllowed(ctx, "prescriptions.write");
      const rx = await db
        .select({ id: prescriptions.id, status: prescriptions.status })
        .from(prescriptions)
        .where(and(eq(prescriptions.id, prescriptionId), isNull(prescriptions.deletedAt)))
        .get();
      if (!rx) throw new NotFoundError("That prescription");
      if (rx.status !== "issued" && rx.status !== "revised") {
        throw new InvalidError("Issue the prescription first.");
      }
      const waiting = (await pendingFor(db, [prescriptionId])).get(prescriptionId);
      if (waiting) return { requestedAt: waiting };

      const id = newUlid();
      const requestedAt = new Date().toISOString();
      await db.batch([
        db.insert(printLog).values({
          id,
          documentKind: DESK_REQUEST_KIND,
          documentId: prescriptionId,
          printedAt: requestedAt,
          printedBy: ctx.userId,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "print_log",
          rowId: id,
          before: null,
          after: { documentKind: DESK_REQUEST_KIND, documentId: prescriptionId },
        }),
      ]);
      return { requestedAt };
    },
  };
}

/** prescription id -> time of a request that has no print after it. */
async function pendingFor(db: Db, ids: string[]): Promise<Map<string, string>> {
  const rows = await db
    .select({
      id: printLog.documentId,
      kind: printLog.documentKind,
      at: sql<string>`max(${printLog.printedAt})`,
    })
    .from(printLog)
    .where(
      and(
        inArray(printLog.documentId, ids),
        inArray(printLog.documentKind, [DESK_REQUEST_KIND, "prescription"]),
        isNull(printLog.deletedAt),
      ),
    )
    .groupBy(printLog.documentId, printLog.documentKind)
    .all();
  const out = new Map<string, string>();
  for (const id of ids) {
    const asked = rows.find((r) => r.id === id && r.kind === DESK_REQUEST_KIND)?.at;
    const printed = rows.find((r) => r.id === id && r.kind === "prescription")?.at;
    if (asked && !(printed && printed >= asked)) out.set(id, asked);
  }
  return out;
}
