import { addIstDays, STAT_DIM_NONE, type DashboardKpis } from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import { bills, dailyStats, monthlyStats, paymentAllocations } from "../schema";
import { computeDayStatRows, computeMonthStatRows, type StatRow } from "./daily-stats-queries";
import { refundsByMode } from "./daily-stats-parts";
import { addMonthsYm, monthPeriod } from "./stats-range";

type Rows = StatRow[];

const metric = (rows: Rows, name: string) =>
  rows.find((r) => r.metric === name && r.dim === STAT_DIM_NONE)?.value ?? 0;

/**
 * S1.1.2 / S1.1.3: the four KPI tiles.
 *  - today: the shared live rows (the caller computes today only once);
 *  - yesterday and last month: read from daily_stats / monthly_stats, computed live only when
 *    nothing is stored for them (the nightly job stores them);
 *  - this month: still computed live. A month is not the sum of its stored days (distinct
 *    patients, and a stored day can be missing or old), so reusing them could change numbers;
 *  - outstanding and refunds: independent, so they go out in one db.batch with the stored reads.
 */
export async function loadKpis(
  db: Db,
  today: string,
  todayRows: () => Promise<Rows>,
): Promise<{ value: DashboardKpis; rowsRead: number }> {
  const yesterday = addIstDays(today, -1);
  const month = today.slice(0, 7);
  const prevMonth = addMonthsYm(month, -1);

  const [[storedY, storedPrev, outstandingRow, reopened, refundRows], monthRows, tRows] =
    await Promise.all([
      db.batch([
        db
          .select({ metric: dailyStats.metric, dim: dailyStats.dim, value: dailyStats.value })
          .from(dailyStats)
          .where(and(eq(dailyStats.dateLocal, yesterday), isNull(dailyStats.deletedAt))),
        db
          .select({ metric: monthlyStats.metric, dim: monthlyStats.dim, value: monthlyStats.value })
          .from(monthlyStats)
          .where(and(eq(monthlyStats.monthLocal, prevMonth), isNull(monthlyStats.deletedAt))),
        outstandingBillsQuery(db),
        reopenedQuery(db),
        refundsByMode(db, monthPeriod(month)),
      ]),
      computeMonthStatRows(db, month),
      todayRows(),
    ]);

  // Not stored (new clinic, cron never ran): compute as before. Rare, so a second round.
  const [yRows, prevMonthRows] = await Promise.all([
    storedY.length > 0 ? storedY : computeDayStatRows(db, yesterday),
    storedPrev.length > 0 ? storedPrev : computeMonthStatRows(db, prevMonth),
  ]);

  const monthRefunds = refundRows.reduce((sum, r) => sum + Number(r.value ?? 0), 0);
  const outstanding = Math.max(
    0,
    Number(outstandingRow[0]?.value ?? 0) + Number(reopened[0]?.value ?? 0),
  );
  const rowsRead =
    tRows.length + yRows.length + monthRows.length + prevMonthRows.length + 2 + refundRows.length;

  return {
    rowsRead,
    value: {
      monthRefundsPaise: monthRefunds,
      monthPaymentsPaise: metric(monthRows, "collected_paise") + monthRefunds,
      todayArrived: metric(tRows, "arrived_patients"),
      prevTodayArrived: metric(yRows, "arrived_patients"),
      monthNew: metric(monthRows, "new_patients"),
      prevMonthNew: metric(prevMonthRows, "new_patients"),
      monthCollectedPaise: metric(monthRows, "collected_paise"),
      prevMonthCollectedPaise: metric(prevMonthRows, "collected_paise"),
      outstandingPaise: outstanding,
    },
  };
}

/** Clinic-wide outstanding: issued bill totals minus what was allocated to them. One row. */
function outstandingBillsQuery(db: Db) {
  return db
    .select({
      value: sql<number>`coalesce(sum(${bills.totalPaise} - coalesce((
        select sum(${paymentAllocations.amountPaise})
        from ${paymentAllocations}
        where ${paymentAllocations.billId} = ${bills.id}
          and ${paymentAllocations.deletedAt} is null
      ), 0)), 0)`,
    })
    .from(bills)
    .where(and(eq(bills.status, "issued"), isNull(bills.deletedAt)));
}

// D1: refunds that went back out of bill payments re-open the due (see bills-paid.ts).
function reopenedQuery(db: Db) {
  return db.all<{ value: number }>(sql`
    select coalesce(sum(max(0, r.refunded - (p.amount_paise - coalesce(a.applied, 0)))), 0) as value
    from payments p
    join (select payment_id, sum(amount_paise) as refunded from refunds
          where deleted_at is null group by payment_id) r on r.payment_id = p.id
    left join (select payment_id, sum(amount_paise) as applied from payment_allocations
               where deleted_at is null group by payment_id) a on a.payment_id = p.id
    where p.deleted_at is null`);
}
