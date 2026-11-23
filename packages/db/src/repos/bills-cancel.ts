import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills, paymentAllocations } from "../schema";
import { nowUtcSql } from "../sql";
import { billsGetRepo, type BillRow } from "./bills-get";

export function billsCancelRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async cancel(id: string, version: number, reason: string): Promise<BillRow> {
      assertAllowed(ctx, "bills.adjust");
      const trimmed = reason.trim();
      if (!trimmed) throw new InvalidError("Enter a reason to cancel this bill.");

      const row = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      if (row.status === "cancelled") {
        throw new InvalidError("This bill is already cancelled.");
      }
      if (row.status !== "issued" && row.status !== "draft") {
        throw new InvalidError("This bill cannot be cancelled.");
      }
      if (row.version !== version) throw new ConflictError();

      if (row.status === "issued") {
        const paid = await db
          .select({
            sum: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
          })
          .from(paymentAllocations)
          .where(and(eq(paymentAllocations.billId, id), isNull(paymentAllocations.deletedAt)))
          .get();
        if (Number(paid?.sum ?? 0) > 0) {
          throw new InvalidError("Refund or move the payments on this bill before cancelling it.");
        }
      }

      const results = await db.batch([
        db
          .update(bills)
          .set({
            status: "cancelled",
            cancelReason: trimmed,
            cancelledAt: nowUtcSql,
            cancelledBy: ctx.userId,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(bills.id, id), eq(bills.version, version)))
          .returning({ id: bills.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { status: row.status },
          after: { status: "cancelled", cancelReason: trimmed },
        }),
      ]);
      const updated = results[0] as { id: string }[];
      if (!updated.length) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}
