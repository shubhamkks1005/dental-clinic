import {
  buildDashboardFromCells,
  istDate,
  parseDashboardRange,
  type DashboardPayload,
  type DashboardRangeQuery,
  type ResolvedDashboardRange,
  type StatCell,
} from "@clinic/shared";
import { and, gte, isNull, lte, ne } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { dailyStats, monthlyStats } from "../schema";
import { computeDayStatRows } from "./daily-stats-queries";

/** 6.3.1: prepared dashboard arrays from daily_stats / monthly_stats (+ live today). */
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
  return buildDashboardFromCells(
    range,
    primary.cells,
    compare.cells,
    primary.rowsRead + compare.rowsRead,
  );
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
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  return prev.toISOString().slice(0, 10);
}
