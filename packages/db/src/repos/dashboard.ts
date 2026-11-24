import {
  addIstDays,
  backupAttentionLine,
  buildDashboardFromCells,
  istDate,
  parseDashboardRange,
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
import { appointments, dailyStats, monthlyStats, opsStatus } from "../schema";
import { computeDayStatRows, type StatRow } from "./daily-stats-queries";
import { loadKpis } from "./dashboard-kpis";

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
  // Today is computed live once and shared by the cells and the KPI tiles (S1.1.2).
  const todayRows = once(() => computeDayStatRows(db, today));
  const noCompare = { cells: [] as StatCell[], rowsRead: 0 };
  // S1.1.3: everything below is independent, so it runs together.
  const [primary, compare, kpis, side] = await Promise.all([
    loadCells(db, range.from, range.to, range.grain, today, todayRows),
    range.compareFrom && range.compareTo
      ? loadCells(db, range.compareFrom, range.compareTo, range.grain, today, todayRows)
      : noCompare,
    loadKpis(db, today, todayRows),
    loadSideReads(db, range.from, range.to, today),
  ]);
  const { heat, backupRow, reqRow } = side;
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
  payload.attention = {
    requests: { open: Number(reqRow?.open ?? 0), overdue: Number(reqRow?.overdue ?? 0) },
    backup: backupAttentionLine(
      backupRow ? { status: backupRow.status, checkedAt: backupRow.checkedAt, detail } : null,
      now.getTime(),
    ),
  };
  return payload;
}

function once<T>(make: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | undefined;
  return () => (p ??= make());
}

/** Busy heat, backup status and open patient requests: three independent reads, one db.batch. */
async function loadSideReads(db: Db, from: string, to: string, today: string) {
  const [heatRows, ops, req] = await db.batch([
    busyHeatQuery(db, from, to),
    db.select().from(opsStatus).where(eq(opsStatus.key, "backup_d1")),
    db
      .select({
        open: sql<number>`count(*)`,
        overdue: sql<number>`coalesce(sum(case when ${patientRequests.dueOn} < ${today} then 1 else 0 end), 0)`,
      })
      .from(patientRequests)
      .where(and(eq(patientRequests.status, "open"), isNull(patientRequests.deletedAt))),
  ]);
  const cells = heatRows.map((r) => ({
    row: DOW[Number(r.dow) ?? 0] ?? "Sun",
    col: String(Number(r.hour)),
    value: Number(r.value ?? 0),
  }));
  return {
    heat: { cells, rowsRead: cells.length },
    backupRow: ops[0],
    reqRow: req[0],
  };
}

/** 6.3.6: arrived appointments by IST weekday × hour (start_min). */
function busyHeatQuery(db: Db, from: string, to: string) {
  return db
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
    );
}

async function loadCells(
  db: Db,
  from: string,
  to: string,
  grain: "day" | "month",
  today: string,
  todayRows: () => Promise<StatRow[]>,
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
    const live = await todayRows();
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
