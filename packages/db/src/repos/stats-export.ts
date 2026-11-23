import { parseDashboardRange } from "@clinic/shared";
import { and, gte, isNull, lte } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { dailyStats } from "../schema";

/** 6.4.2: CSV of daily_stats for a date range (aggregates only). */
export function statsExportRepo(db: Db, ctx: Ctx) {
  return {
    async csv(query: {
      from?: string | null;
      to?: string | null;
    }): Promise<{ csv: string; from: string; to: string; rows: number }> {
      assertAllowed(ctx, "reports.full");
      const parsed = parseDashboardRange(
        { range: "custom", from: query.from, to: query.to },
        new Date(),
      );
      if (!parsed.ok) throw new InvalidError(parsed.message);
      const { from, to } = parsed.range;
      const rows = await db
        .select({
          dateLocal: dailyStats.dateLocal,
          metric: dailyStats.metric,
          dim: dailyStats.dim,
          value: dailyStats.value,
        })
        .from(dailyStats)
        .where(
          and(
            gte(dailyStats.dateLocal, from),
            lte(dailyStats.dateLocal, to),
            isNull(dailyStats.deletedAt),
          ),
        )
        .all();
      const lines = ["date_local,metric,dim,value"];
      for (const r of rows) {
        const dim = csvEscape(r.dim);
        lines.push(`${r.dateLocal},${r.metric},${dim},${r.value}`);
      }
      return { csv: lines.join("\n") + "\n", from, to, rows: rows.length };
    },
  };
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
