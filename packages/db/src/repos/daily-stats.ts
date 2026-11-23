import { addIstDays, istDate, newUlid } from "@clinic/shared";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { dailyStats, monthlyStats } from "../schema";
import { computeDayStatRows, computeMonthStatRows, type StatRow } from "./daily-stats-queries";

/** Manual recompute cooldown (seconds). Magic number cleaned in 6.5.3. */
export const STATS_RECOMPUTE_COOLDOWN_SEC = 60;

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

    /**
     * 6.2.3: recompute today + previous 2 days (3 days). Rate-limited for the doctor button.
     * Cron passes rateLimit=false.
     */
    async recomputeRecentDays(
      now: Date = new Date(),
      opts: { rateLimit?: boolean; days?: number } = {},
    ): Promise<{ days: string[] }> {
      assertAllowed(ctx, "reports.full");
      const days = opts.days ?? 3;
      if (opts.rateLimit !== false) {
        const latest = await db
          .select({ updatedAt: dailyStats.updatedAt })
          .from(dailyStats)
          .where(and(eq(dailyStats.updatedBy, ctx.userId), isNull(dailyStats.deletedAt)))
          .orderBy(desc(dailyStats.updatedAt))
          .limit(1)
          .get();
        if (latest?.updatedAt) {
          const ago = (now.getTime() - new Date(latest.updatedAt).getTime()) / 1000;
          if (ago < STATS_RECOMPUTE_COOLDOWN_SEC) {
            throw new InvalidError(
              `Wait ${STATS_RECOMPUTE_COOLDOWN_SEC} seconds before recomputing again.`,
            );
          }
        }
      }
      const today = istDate(now);
      const list: string[] = [];
      for (let i = 0; i < days; i++) {
        const day = addIstDays(today, -i);
        list.push(day);
        await this.recomputeDay(day, now);
      }
      const months = [...new Set(list.map((d) => d.slice(0, 7)))];
      for (const m of months) await this.recomputeMonth(m, now);
      return { days: list };
    },
  };
}
