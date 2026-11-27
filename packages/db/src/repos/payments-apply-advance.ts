import { newUlid } from "@clinic/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills, paymentAllocations, payments } from "../schema";
import { openBillDues } from "./bills-dues";
import { advanceSlices } from "./payments-advance";

export function paymentsApplyAdvanceRepo(db: Db, ctx: Ctx) {
  return {
    /** The patient's unused money (advance), newest payment first, with its mode (visit finished:
     * "Returned" refunds these). */
    async advanceLeft(
      patientId: string,
    ): Promise<{ paymentId: string; unallocatedPaise: number; mode: string }[]> {
      assertAllowed(ctx, "bills.create");
      const slices = await advanceSlices(db, patientId);
      if (slices.length === 0) return [];
      const modes = await db
        .select({ id: payments.id, mode: payments.mode })
        .from(payments)
        .where(
          inArray(
            payments.id,
            slices.map((s) => s.paymentId),
          ),
        )
        .all();
      return slices
        .map((s) => ({ ...s, mode: modes.find((m) => m.id === s.paymentId)?.mode ?? "cash" }))
        .reverse();
    },

    /** Allocate existing patient advance onto one issued bill (5.3.5). */
    async applyAdvanceToBill(billId: string): Promise<{ appliedPaise: number }> {
      assertAllowed(ctx, "bills.create");
      const bill = await db
        .select({
          id: bills.id,
          patientId: bills.patientId,
          status: bills.status,
        })
        .from(bills)
        .where(and(eq(bills.id, billId), isNull(bills.deletedAt)))
        .get();
      if (!bill) throw new NotFoundError("That bill");
      if (bill.status !== "issued") {
        throw new InvalidError("Advance can only be applied to an issued bill.");
      }

      const dues = await openBillDues(db, bill.patientId);
      const dueRow = dues.find((d) => d.billId === billId);
      let need = dueRow?.duePaise ?? 0;
      if (need <= 0) return { appliedPaise: 0 };

      const slices = await advanceSlices(db, bill.patientId);
      const allocInserts = [];
      let appliedPaise = 0;
      const allocations: { paymentId: string; amountPaise: number }[] = [];

      for (const slice of slices) {
        if (need <= 0) break;
        const take = Math.min(slice.unallocatedPaise, need);
        if (take <= 0) continue;
        allocInserts.push(
          db.insert(paymentAllocations).values({
            id: newUlid(),
            paymentId: slice.paymentId,
            billId,
            amountPaise: take,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
        );
        allocations.push({ paymentId: slice.paymentId, amountPaise: take });
        appliedPaise += take;
        need -= take;
      }

      if (allocInserts.length === 0) return { appliedPaise: 0 };

      const [first, ...rest] = allocInserts;
      await db.batch([
        first!,
        ...rest,
        auditInsert(db, ctx, {
          action: "create",
          table: "payment_allocations",
          rowId: billId,
          after: { billId, appliedPaise, allocations },
        }),
      ]);
      return { appliedPaise };
    },
  };
}
