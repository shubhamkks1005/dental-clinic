import { STAT_DIM_NONE } from "@clinic/shared";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import { appointments, bills, patients } from "../schema";
import {
  collectedQueries,
  collectedRows,
  proceduresQuery,
  proceduresRows,
  referralsQuery,
  referralsRows,
  type StatRow,
} from "./daily-stats-parts";
import { dayPeriod, inDays, monthPeriod, type StatPeriod } from "./stats-range";

export type { StatRow };

const ARRIVED = ["arrived", "in_chair", "completed"] as const;

function n(v: number | null | undefined): number {
  return Number(v ?? 0);
}

/**
 * S1.1.1: the 11 independent aggregate queries of one period go out in ONE db.batch (one round
 * trip). The numbers are built from the batch results in the same order as before.
 */
async function computeStatRows(db: Db, p: StatPeriod): Promise<StatRow[]> {
  const live = isNull(appointments.deletedAt);
  // No-show % pool excludes walk-ins (PLAN 6.1).
  const notWalkIn = ne(appointments.source, "walk_in");
  const [pay1, pay2, pay3] = collectedQueries(db, p);

  const [arrived, neu, statuses, noshow, noshowArrived, billed, c1, c2, c3, procs, refs] =
    await db.batch([
      db
        .select({ value: sql<number>`count(distinct ${appointments.patientId})` })
        .from(appointments)
        .where(
          and(inDays(appointments.dateLocal, p), live, inArray(appointments.status, [...ARRIVED])),
        ),
      db
        .select({ value: sql<number>`count(*)` })
        .from(patients)
        .where(
          and(
            inDays(patients.firstArrivedOn, p),
            isNull(patients.legacyRef),
            isNull(patients.deletedAt),
          ),
        ),
      db
        .select({ dim: appointments.status, value: sql<number>`count(*)` })
        .from(appointments)
        .where(and(inDays(appointments.dateLocal, p), live))
        .groupBy(appointments.status),
      db
        .select({ value: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            inDays(appointments.dateLocal, p),
            live,
            eq(appointments.status, "no_show"),
            notWalkIn,
          ),
        ),
      db
        .select({ value: sql<number>`count(distinct ${appointments.patientId})` })
        .from(appointments)
        .where(
          and(
            inDays(appointments.dateLocal, p),
            live,
            inArray(appointments.status, [...ARRIVED]),
            notWalkIn,
          ),
        ),
      db
        .select({ value: sql<number>`coalesce(sum(${bills.totalPaise}), 0)` })
        .from(bills)
        .where(and(inDays(bills.billOn, p), eq(bills.status, "issued"), isNull(bills.deletedAt))),
      pay1,
      pay2,
      pay3,
      proceduresQuery(db, p),
      referralsQuery(db, p),
    ]);

  const arrivedN = n(arrived[0]?.value);
  const newN = n(neu[0]?.value);
  const out: StatRow[] = [
    { metric: "arrived_patients", dim: STAT_DIM_NONE, value: arrivedN },
    { metric: "new_patients", dim: STAT_DIM_NONE, value: newN },
    { metric: "returning_patients", dim: STAT_DIM_NONE, value: Math.max(0, arrivedN - newN) },
  ];
  for (const r of statuses) out.push({ metric: "appt_status", dim: r.dim, value: n(r.value) });
  out.push({ metric: "noshow_count", dim: STAT_DIM_NONE, value: n(noshow[0]?.value) });
  out.push({ metric: "noshow_arrived", dim: STAT_DIM_NONE, value: n(noshowArrived[0]?.value) });
  out.push({ metric: "billed_paise", dim: STAT_DIM_NONE, value: n(billed[0]?.value) });
  out.push(...collectedRows(c1, c2, c3));
  out.push(...proceduresRows(procs));
  out.push(...referralsRows(refs));
  return out;
}

/** Aggregates for one IST day, one db.batch. */
export function computeDayStatRows(db: Db, dayLocal: string): Promise<StatRow[]> {
  return computeStatRows(db, dayPeriod(dayLocal));
}

/** Month aggregates from source tables (month_local = YYYY-MM), one db.batch. */
export function computeMonthStatRows(db: Db, monthLocal: string): Promise<StatRow[]> {
  return computeStatRows(db, monthPeriod(monthLocal));
}
