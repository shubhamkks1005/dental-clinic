import { newUlid } from "@clinic/shared";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { dailyStats, monthlyStats } from "../schema";
import { computeDayStatRows, computeMonthStatRows, type StatRow } from "./daily-stats-queries";

export function dailyStatsRepo(db: Db, ctx: Ctx) {
  return {
    /** Recompute one IST day into daily_stats (INSERT OR REPLACE; safe to re-run). */
    async recomputeDay(dateLocal: string, now: Date = new Date()): Promise<StatRow[]> {
      assertAllowed(ctx, "reports.full");
      const rows = await computeDayStatRows(db, dateLocal);
      const nowIso = now.toISOString();
      const upserts = rows.map((r) =>
        db
          .insert(dailyStats)
          .values({
            id: newUlid(),
            dateLocal,
            metric: r.metric,
            dim: r.dim,
            value: r.value,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
            createdAt: nowIso,
            updatedAt: nowIso,
          })
          .onConflictDoUpdate({
            target: [dailyStats.dateLocal, dailyStats.metric, dailyStats.dim],
            set: {
              value: r.value,
              deletedAt: null,
              updatedAt: nowIso,
              updatedBy: ctx.userId,
              version: sql`${dailyStats.version} + 1`,
            },
          }),
      );
      const prune = db
        .update(dailyStats)
        .set({
          deletedAt: nowIso,
          updatedAt: nowIso,
          updatedBy: ctx.userId,
          version: sql`${dailyStats.version} + 1`,
        })
        .where(
          and(
            eq(dailyStats.dateLocal, dateLocal),
            isNull(dailyStats.deletedAt),
            ne(dailyStats.updatedAt, nowIso),
          ),
        );
      await db.batch([prune, ...upserts]);
      return rows;
    },

    /** Recompute one IST month into monthly_stats. */
    async recomputeMonth(monthLocal: string, now: Date = new Date()): Promise<StatRow[]> {
      assertAllowed(ctx, "reports.full");
      const rows = await computeMonthStatRows(db, monthLocal);
      const nowIso = now.toISOString();
      const upserts = rows.map((r) =>
        db
          .insert(monthlyStats)
          .values({
            id: newUlid(),
            monthLocal,
            metric: r.metric,
            dim: r.dim,
            value: r.value,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
            createdAt: nowIso,
            updatedAt: nowIso,
          })
          .onConflictDoUpdate({
            target: [monthlyStats.monthLocal, monthlyStats.metric, monthlyStats.dim],
            set: {
              value: r.value,
              deletedAt: null,
              updatedAt: nowIso,
              updatedBy: ctx.userId,
              version: sql`${monthlyStats.version} + 1`,
            },
          }),
      );
      const prune = db
        .update(monthlyStats)
        .set({
          deletedAt: nowIso,
          updatedAt: nowIso,
          updatedBy: ctx.userId,
          version: sql`${monthlyStats.version} + 1`,
        })
        .where(
          and(
            eq(monthlyStats.monthLocal, monthLocal),
            isNull(monthlyStats.deletedAt),
            ne(monthlyStats.updatedAt, nowIso),
          ),
        );
      await db.batch([prune, ...upserts]);
      return rows;
    },

    async listDay(dateLocal: string): Promise<StatRow[]> {
      assertAllowed(ctx, "reports.full");
      return db
        .select({
          metric: dailyStats.metric,
          dim: dailyStats.dim,
          value: dailyStats.value,
        })
        .from(dailyStats)
        .where(and(eq(dailyStats.dateLocal, dateLocal), isNull(dailyStats.deletedAt)))
        .all();
    },

    async listMonth(monthLocal: string): Promise<StatRow[]> {
      assertAllowed(ctx, "reports.full");
      return db
        .select({
          metric: monthlyStats.metric,
          dim: monthlyStats.dim,
          value: monthlyStats.value,
        })
        .from(monthlyStats)
        .where(and(eq(monthlyStats.monthLocal, monthLocal), isNull(monthlyStats.deletedAt)))
        .all();
    },
  };
}
