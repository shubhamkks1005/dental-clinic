import { istDate } from "@clinic/shared";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { appointments, payments, refunds } from "../schema";

export type TodaySummary = {
  dateLocal: string;
  arrived: number;
  remaining: number;
  collectedPaise: number;
};

const ARRIVED = ["arrived", "in_chair", "completed"] as const;
const REMAINING = ["scheduled", "confirmed", "arrived", "in_chair"] as const;

/** 6.3.8: receptionist-safe today totals (reports.today). */
export function todaySummaryRepo(db: Db, ctx: Ctx) {
  return {
    async get(now: Date = new Date()): Promise<TodaySummary> {
      assertAllowed(ctx, "reports.today");
      const dateLocal = istDate(now);

      const arrived = await db
        .select({ value: sql<number>`count(distinct ${appointments.patientId})` })
        .from(appointments)
        .where(
          and(
            eq(appointments.dateLocal, dateLocal),
            isNull(appointments.deletedAt),
            inArray(appointments.status, [...ARRIVED]),
          ),
        )
        .get();

      const remaining = await db
        .select({ value: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.dateLocal, dateLocal),
            isNull(appointments.deletedAt),
            inArray(appointments.status, [...REMAINING]),
          ),
        )
        .get();

      const paid = await db
        .select({
          value: sql<number>`coalesce(sum(${payments.amountPaise}), 0)`,
        })
        .from(payments)
        .where(and(eq(payments.dayLocal, dateLocal), isNull(payments.deletedAt)))
        .get();

      const refundDay = sql`date(${refunds.approvedAt}, '+5 hours', '+30 minutes')`;
      const refunded = await db
        .select({
          value: sql<number>`coalesce(sum(${refunds.amountPaise}), 0)`,
        })
        .from(refunds)
        .where(and(isNull(refunds.deletedAt), sql`${refundDay} = ${dateLocal}`))
        .get();

      return {
        dateLocal,
        arrived: Number(arrived?.value ?? 0),
        remaining: Number(remaining?.value ?? 0),
        collectedPaise: Number(paid?.value ?? 0) - Number(refunded?.value ?? 0),
      };
    },
  };
}
