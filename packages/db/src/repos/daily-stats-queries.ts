import { STAT_DIM_NONE } from "@clinic/shared";
import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";
import type { Db } from "../client";
import { appointments, bills, patients } from "../schema";
import {
  appendCollected,
  appendProcedures,
  appendReferrals,
  type StatRow,
} from "./daily-stats-parts";

export type { StatRow };

const ARRIVED = ["arrived", "in_chair", "completed"] as const;

function n(v: number | null | undefined): number {
  return Number(v ?? 0);
}

async function patientFlow(
  db: Db,
  out: StatRow[],
  dayPred: ReturnType<typeof eq> | ReturnType<typeof like>,
  firstArrivedPred: ReturnType<typeof eq> | ReturnType<typeof like>,
) {
  const arrived = await db
    .select({ value: sql<number>`count(distinct ${appointments.patientId})` })
    .from(appointments)
    .where(and(dayPred, isNull(appointments.deletedAt), inArray(appointments.status, [...ARRIVED])))
    .get();
  const arrivedN = n(arrived?.value);
  out.push({ metric: "arrived_patients", dim: STAT_DIM_NONE, value: arrivedN });

  const neu = await db
    .select({ value: sql<number>`count(*)` })
    .from(patients)
    .where(and(firstArrivedPred, isNull(patients.legacyRef), isNull(patients.deletedAt)))
    .get();
  const newN = n(neu?.value);
  out.push({ metric: "new_patients", dim: STAT_DIM_NONE, value: newN });
  out.push({
    metric: "returning_patients",
    dim: STAT_DIM_NONE,
    value: Math.max(0, arrivedN - newN),
  });

  const statuses = await db
    .select({ dim: appointments.status, value: sql<number>`count(*)` })
    .from(appointments)
    .where(and(dayPred, isNull(appointments.deletedAt)))
    .groupBy(appointments.status)
    .all();
  for (const r of statuses) {
    out.push({ metric: "appt_status", dim: r.dim, value: n(r.value) });
  }
}

/** Pure SQL aggregates for one IST day (no JS row loops). */
export async function computeDayStatRows(db: Db, dayLocal: string): Promise<StatRow[]> {
  const out: StatRow[] = [];
  await patientFlow(
    db,
    out,
    eq(appointments.dateLocal, dayLocal),
    eq(patients.firstArrivedOn, dayLocal),
  );

  const billed = await db
    .select({ value: sql<number>`coalesce(sum(${bills.totalPaise}), 0)` })
    .from(bills)
    .where(and(eq(bills.billOn, dayLocal), eq(bills.status, "issued"), isNull(bills.deletedAt)))
    .get();
  out.push({ metric: "billed_paise", dim: STAT_DIM_NONE, value: n(billed?.value) });

  await appendCollected(db, out, dayLocal, null);
  await appendProcedures(db, out, dayLocal, null);
  await appendReferrals(db, out, dayLocal, null);
  return out;
}

/** Month aggregates from source tables (month_local = YYYY-MM). */
export async function computeMonthStatRows(db: Db, monthLocal: string): Promise<StatRow[]> {
  const out: StatRow[] = [];
  const dayLike = `${monthLocal}-%`;
  await patientFlow(
    db,
    out,
    like(appointments.dateLocal, dayLike),
    like(patients.firstArrivedOn, dayLike),
  );

  const billed = await db
    .select({ value: sql<number>`coalesce(sum(${bills.totalPaise}), 0)` })
    .from(bills)
    .where(and(like(bills.billOn, dayLike), eq(bills.status, "issued"), isNull(bills.deletedAt)))
    .get();
  out.push({ metric: "billed_paise", dim: STAT_DIM_NONE, value: n(billed?.value) });

  await appendCollected(db, out, null, monthLocal);
  await appendProcedures(db, out, null, monthLocal);
  await appendReferrals(db, out, null, monthLocal);
  return out;
}
