import {
  addIstDays,
  backupAttentionLine,
  buildDashboardFromCells,
  istDate,
  parseDashboardRange,
  STAT_DIM_NONE,
  type DashboardKpis,
  type DashboardPayload,
  type DashboardRangeQuery,
  type ResolvedDashboardRange,
  type StatCell,
} from "@clinic/shared";
import { and, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { patientRequests } from "../schema/patient-requests";
import {
  appointments,
  bills,
  dailyStats,
  monthlyStats,
  opsStatus,
  paymentAllocations,
} from "../schema";
import { computeDayStatRows, computeMonthStatRows } from "./daily-stats-queries";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** 6.3.1 / 6.3.3: prepared dashboard arrays + fixed top-4 KPIs. */
export function dashboardRepo(db: Db, ctx: Ctx) {
  return {
    async get(query: DashboardRangeQuery, now: Date = new Date()): Promise<DashboardPayload> {
      assertAllowed(ctx, "reports.full");
      const parsed = parseDashboardRange(query, now);
      if (!parsed.ok) throw new InvalidError(parsed.message);
      return loadPayload(db, parsed.range, now);
    },
  };
}

async function loadPayload(
  db: Db,
  range: ResolvedDashboardRange,
  now: Date,
): Promise<DashboardPayload> {
  const today = istDate(now);
  const primary = await loadCells(db, range.from, range.to, range.grain, today);
  let compare: { cells: StatCell[]; rowsRead: number } = { cells: [], rowsRead: 0 };
  if (range.compareFrom && range.compareTo) {
    compare = await loadCells(db, range.compareFrom, range.compareTo, range.grain, today);
  }
  const kpis = await loadKpis(db, today);
  const heat = await loadBusyHeat(db, range.from, range.to);
  const backupRow = await db.select().from(opsStatus).where(eq(opsStatus.key, "backup_d1")).get();
  const payload = buildDashboardFromCells(
    range,
    primary.cells,
    compare.cells,
    primary.rowsRead + compare.rowsRead + kpis.rowsRead + heat.rowsRead + 1,
    kpis.value,
    heat.cells,
  );
  let detail: { sizeBytes?: number } = {};
  if (backupRow?.detailJson) {
    try {
      detail = JSON.parse(backupRow.detailJson) as { sizeBytes?: number };
    } catch {
      detail = {};
    }
  }
  const reqRow = await db
    .select({
      open: sql<number>`count(*)`,
      overdue: sql<number>`coalesce(sum(case when ${patientRequests.dueOn} < ${today} then 1 else 0 end), 0)`,
    })
    .from(patientRequests)
    .where(and(eq(patientRequests.status, "open"), isNull(patientRequests.deletedAt)))
    .get();
  payload.attention = {
    requests: { open: reqRow?.open ?? 0, overdue: reqRow?.overdue ?? 0 },
    backup: backupAttentionLine(
      backupRow ? { status: backupRow.status, checkedAt: backupRow.checkedAt, detail } : null,
      now.getTime(),
    ),
  };
  return payload;
}

async function loadKpis(
  db: Db,
  today: string,
): Promise<{ value: DashboardKpis; rowsRead: number }> {
  let rowsRead = 0;
  const todayRows = await computeDayStatRows(db, today);
  rowsRead += todayRows.length;
  const yesterday = addIstDays(today, -1);
  const yRows = await computeDayStatRows(db, yesterday);
  rowsRead += yRows.length;

  const month = today.slice(0, 7);
  const monthRows = await computeMonthStatRows(db, month);
  rowsRead += monthRows.length;
  const prevMonth = addMonthsYm(month, -1);
  const prevMonthRows = await computeMonthStatRows(db, prevMonth);
  rowsRead += prevMonthRows.length;

  const outstanding = await outstandingPaise(db);
  rowsRead += 1;

  const metric = (rows: { metric: string; dim: string; value: number }[], name: string) =>
    rows.find((r) => r.metric === name && r.dim === STAT_DIM_NONE)?.value ?? 0;

  return {
    rowsRead,
    value: {
      todayArrived: metric(todayRows, "arrived_patients"),
      prevTodayArrived: metric(yRows, "arrived_patients"),
      monthNew: metric(monthRows, "new_patients"),
      prevMonthNew: metric(prevMonthRows, "new_patients"),
      monthCollectedPaise: metric(monthRows, "collected_paise"),
      prevMonthCollectedPaise: metric(prevMonthRows, "collected_paise"),
      outstandingPaise: outstanding,
    },
  };
}

/** 6.3.6: arrived appointments by IST weekday × hour (start_min). */
async function loadBusyHeat(
  db: Db,
  from: string,
  to: string,
): Promise<{ cells: { row: string; col: string; value: number }[]; rowsRead: number }> {
  const rows = await db
    .select({
      dow: sql<number>`cast(strftime('%w', ${appointments.dateLocal}) as integer)`,
      hour: sql<number>`cast(${appointments.startMin} / 60 as integer)`,
      value: sql<number>`count(*)`,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.dateLocal, from),
        lte(appointments.dateLocal, to),
        isNull(appointments.deletedAt),
        sql`${appointments.status} in ('arrived', 'in_chair', 'completed')`,
      ),
    )
    .groupBy(
      sql`strftime('%w', ${appointments.dateLocal})`,
      sql`cast(${appointments.startMin} / 60 as integer)`,
    )
    .all();
  const cells = rows.map((r) => ({
    row: DOW[Number(r.dow) ?? 0] ?? "Sun",
    col: String(Number(r.hour)),
    value: Number(r.value ?? 0),
  }));
  return { cells, rowsRead: cells.length };
}

/** Clinic-wide outstanding (issued − allocated). One aggregate row. */
async function outstandingPaise(db: Db): Promise<number> {
  const row = await db
    .select({
      value: sql<number>`coalesce(sum(${bills.totalPaise} - coalesce((
        select sum(${paymentAllocations.amountPaise})
        from ${paymentAllocations}
        where ${paymentAllocations.billId} = ${bills.id}
          and ${paymentAllocations.deletedAt} is null
      ), 0)), 0)`,
    })
    .from(bills)
    .where(and(eq(bills.status, "issued"), isNull(bills.deletedAt)))
    .get();
  return Math.max(0, Number(row?.value ?? 0));
}

async function loadCells(
  db: Db,
  from: string,
  to: string,
  grain: "day" | "month",
  today: string,
): Promise<{ cells: StatCell[]; rowsRead: number }> {
  if (grain === "month") {
    const fromM = from.slice(0, 7);
    const toM = to.slice(0, 7);
    const rows = await db
      .select({
        period: monthlyStats.monthLocal,
        metric: monthlyStats.metric,
        dim: monthlyStats.dim,
        value: monthlyStats.value,
      })
      .from(monthlyStats)
      .where(
        and(
          gte(monthlyStats.monthLocal, fromM),
          lte(monthlyStats.monthLocal, toM),
          isNull(monthlyStats.deletedAt),
        ),
      )
      .all();
    return { cells: rows, rowsRead: rows.length };
  }

  const pastTo = to >= today ? (from < today ? addDayBefore(today) : null) : to;
  let rowsRead = 0;
  const cells: StatCell[] = [];

  if (pastTo && from <= pastTo) {
    const stored = await db
      .select({
        period: dailyStats.dateLocal,
        metric: dailyStats.metric,
        dim: dailyStats.dim,
        value: dailyStats.value,
      })
      .from(dailyStats)
      .where(
        and(
          gte(dailyStats.dateLocal, from),
          lte(dailyStats.dateLocal, pastTo),
          ne(dailyStats.dateLocal, today),
          isNull(dailyStats.deletedAt),
        ),
      )
      .all();
    cells.push(...stored);
    rowsRead += stored.length;
  }

  if (from <= today && today <= to) {
    const live = await computeDayStatRows(db, today);
    rowsRead += live.length;
    for (const r of live) {
      cells.push({ period: today, metric: r.metric, dim: r.dim, value: r.value });
    }
  }

  return { cells, rowsRead };
}

function addDayBefore(day: string): string {
  return addIstDays(day, -1);
}

function addMonthsYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
