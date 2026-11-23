import { newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billCancelRequests, bills, patients } from "../schema";
import { nowUtcSql } from "../sql";

/** Q1.9 (D4): the receptionist asks the doctor to cancel a wrong issued bill; the doctor sees it. */
export function billsCancelRequestRepo(db: Db, ctx: Ctx) {
  return {
    async requestCancel(billId: string, reason: string): Promise<{ id: string }> {
      assertAllowed(ctx, "bills.create");
      const text = reason.trim();
      if (!text) throw new InvalidError("Say why this bill is wrong.");
      if (text.length > 200) throw new InvalidError("Keep the reason under 200 letters.");
      const bill = await db
        .select({ id: bills.id, status: bills.status })
        .from(bills)
        .where(and(eq(bills.id, billId), isNull(bills.deletedAt)))
        .get();
      if (!bill) throw new NotFoundError("That bill");
      if (bill.status !== "issued") {
        throw new InvalidError("Only an issued bill needs a request. A draft can be edited.");
      }
      const open = await db
        .select({ id: billCancelRequests.id })
        .from(billCancelRequests)
        .where(
          and(
            eq(billCancelRequests.billId, billId),
            eq(billCancelRequests.status, "open"),
            isNull(billCancelRequests.deletedAt),
          ),
        )
        .get();
      if (open) throw new ConflictError("The doctor has already been asked about this bill.");

      const id = newUlid();
      await db.batch([
        db.insert(billCancelRequests).values({
          id,
          billId,
          reason: text,
          status: "open",
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "bill_cancel_requests",
          rowId: id,
          before: null,
          after: { billId, reason: text },
        }),
      ]);
      return { id };
    },

    /** Doctor: open requests for the "Waiting for you" list. */
    async listOpenCancelRequests() {
      assertAllowed(ctx, "bills.adjust");
      return db
        .select({
          id: billCancelRequests.id,
          billId: billCancelRequests.billId,
          billNo: bills.billNo,
          patientId: bills.patientId,
          patientName: patients.fullName,
          reason: billCancelRequests.reason,
        })
        .from(billCancelRequests)
        .innerJoin(bills, eq(bills.id, billCancelRequests.billId))
        .innerJoin(patients, eq(patients.id, bills.patientId))
        .where(and(eq(billCancelRequests.status, "open"), isNull(billCancelRequests.deletedAt)))
        .orderBy(asc(billCancelRequests.createdAt))
        .limit(50)
        .all();
    },

    /** The open request for one bill (the bill screen shows it to both roles). */
    async openCancelRequestFor(billId: string) {
      assertAllowed(ctx, "bills.create");
      return (
        (await db
          .select({ id: billCancelRequests.id, reason: billCancelRequests.reason })
          .from(billCancelRequests)
          .where(
            and(
              eq(billCancelRequests.billId, billId),
              eq(billCancelRequests.status, "open"),
              isNull(billCancelRequests.deletedAt),
            ),
          )
          .get()) ?? null
      );
    },

    /** Doctor: the request is not needed (the bill stays). */
    async dismissCancelRequest(id: string) {
      assertAllowed(ctx, "bills.adjust");
      const res = await db.batch([
        db
          .update(billCancelRequests)
          .set({
            status: "dismissed",
            closedAt: nowUtcSql,
            closedBy: ctx.userId,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(billCancelRequests.id, id), eq(billCancelRequests.status, "open")))
          .returning({ id: billCancelRequests.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "bill_cancel_requests",
          rowId: id,
          before: { status: "open" },
          after: { status: "dismissed" },
        }),
      ]);
      if (!(res[0] as { id: string }[]).length) throw new NotFoundError("That request");
    },
  };
}
