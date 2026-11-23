import {
  financialYearOf,
  newUlid,
  shortFinancialYear,
  type RecordRefundInput,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { takeNumber } from "../numbering";
import { assertAllowed } from "../permissions";
import { payments, refunds, settings } from "../schema";
import { nowUtcSql } from "../sql";

async function shadowSeries(db: Db): Promise<boolean> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "billing.shadow_series"), isNull(settings.deletedAt)))
    .get();
  if (!row) return true;
  try {
    return JSON.parse(row.valueJson) === true;
  } catch {
    return true;
  }
}

function refundNoSql(period: string, value: ReturnType<typeof sql<number>>, shadow: boolean) {
  const prefix = shadow ? "SF" : "F";
  const short = shortFinancialYear(period);
  return sql<string>`printf('%s-%s-%06d', ${prefix}, ${short}, ${value})`;
}

export type RefundRow = {
  id: string;
  paymentId: string;
  patientId: string;
  amountPaise: number;
  mode: string;
  reason: string;
  refundNo: string | null;
};

export function refundsCreateRepo(db: Db, ctx: Ctx) {
  return {
    async record(input: RecordRefundInput): Promise<RefundRow> {
      assertAllowed(ctx, "bills.adjust");

      const payment = await db
        .select()
        .from(payments)
        .where(and(eq(payments.id, input.paymentId), isNull(payments.deletedAt)))
        .get();
      if (!payment) throw new NotFoundError("That payment");

      const prior = await db
        .select({
          sum: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
        })
        .from(refunds)
        .where(and(eq(refunds.paymentId, input.paymentId), isNull(refunds.deletedAt)))
        .get();
      const already = Number(prior?.sum ?? 0);
      const remaining = payment.amountPaise - already;
      if (input.amountPaise > remaining) {
        throw new InvalidError(
          "A refund cannot be more than the payment left after earlier refunds.",
        );
      }

      const period = financialYearOf(new Date());
      const shadow = await shadowSeries(db);
      const { bump, value } = takeNumber(db, "refund", period, ctx.userId);
      const id = newUlid();
      const refundNo = refundNoSql(period, value, shadow);

      await db.batch([
        bump,
        db.insert(refunds).values({
          id,
          paymentId: input.paymentId,
          patientId: payment.patientId,
          amountPaise: input.amountPaise,
          mode: input.mode,
          reason: input.reason,
          refundNo,
          refundPeriod: period,
          approvedBy: ctx.userId,
          approvedAt: nowUtcSql,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "refunds",
          rowId: id,
          before: null,
          after: {
            paymentId: input.paymentId,
            amountPaise: input.amountPaise,
            mode: input.mode,
            reason: input.reason,
          },
        }),
      ]);

      const row = await db
        .select({
          id: refunds.id,
          paymentId: refunds.paymentId,
          patientId: refunds.patientId,
          amountPaise: refunds.amountPaise,
          mode: refunds.mode,
          reason: refunds.reason,
          refundNo: refunds.refundNo,
        })
        .from(refunds)
        .where(eq(refunds.id, id))
        .get();
      if (!row) throw new NotFoundError("That refund");
      return row;
    },
  };
}
