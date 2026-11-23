import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { paymentAllocations, payments, refunds } from "../schema";

export type PaymentDetail = {
  id: string;
  patientId: string;
  amountPaise: number;
  mode: string;
  splitMode: string | null;
  splitPaise: number | null;
  reference: string;
  receiptNo: string | null;
  dayLocal: string;
  notes: string;
  refundedPaise: number;
};

export function paymentsGetRepo(db: Db, ctx: Ctx) {
  return {
    async get(id: string): Promise<PaymentDetail> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select({
          id: payments.id,
          patientId: payments.patientId,
          amountPaise: payments.amountPaise,
          mode: payments.mode,
          splitMode: payments.splitMode,
          splitPaise: payments.splitPaise,
          reference: payments.reference,
          receiptNo: payments.receiptNo,
          dayLocal: payments.dayLocal,
          notes: payments.notes,
        })
        .from(payments)
        .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That payment");

      const refundRow = await db
        .select({ sum: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)` })
        .from(refunds)
        .where(and(eq(refunds.paymentId, id), isNull(refunds.deletedAt)))
        .get();

      return { ...row, refundedPaise: Number(refundRow?.sum ?? 0) };
    },

    async allocationsForPayment(paymentId: string) {
      assertAllowed(ctx, "bills.create");
      return db
        .select({
          billId: paymentAllocations.billId,
          amountPaise: paymentAllocations.amountPaise,
        })
        .from(paymentAllocations)
        .where(
          and(eq(paymentAllocations.paymentId, paymentId), isNull(paymentAllocations.deletedAt)),
        )
        .all();
    },
  };
}
