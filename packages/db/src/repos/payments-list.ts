import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, payments, refunds } from "../schema";

export type PatientPaymentRow = {
  id: string;
  amountPaise: number;
  mode: string;
  splitMode: string | null;
  splitPaise: number | null;
  reference: string;
  receiptNo: string | null;
  dayLocal: string;
  refundedPaise: number;
  refundablePaise: number;
};

export function paymentsListRepo(db: Db, ctx: Ctx) {
  return {
    async listForPatient(patientId: string): Promise<PatientPaymentRow[]> {
      assertAllowed(ctx, "bills.create");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const rows = await db
        .select({
          id: payments.id,
          amountPaise: payments.amountPaise,
          mode: payments.mode,
          splitMode: payments.splitMode,
          splitPaise: payments.splitPaise,
          reference: payments.reference,
          receiptNo: payments.receiptNo,
          dayLocal: payments.dayLocal,
        })
        .from(payments)
        .where(and(eq(payments.patientId, patientId), isNull(payments.deletedAt)))
        .orderBy(desc(payments.receivedAt), desc(payments.createdAt))
        .all();
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.id);
      const refundRows = await db
        .select({
          paymentId: refunds.paymentId,
          sum: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
        })
        .from(refunds)
        .where(and(inArray(refunds.paymentId, ids), isNull(refunds.deletedAt)))
        .groupBy(refunds.paymentId)
        .all();
      const refundMap = new Map(refundRows.map((r) => [r.paymentId, Number(r.sum)]));

      return rows.map((r) => {
        const refundedPaise = refundMap.get(r.id) ?? 0;
        return {
          ...r,
          refundedPaise,
          refundablePaise: r.amountPaise - refundedPaise,
        };
      });
    },
  };
}
