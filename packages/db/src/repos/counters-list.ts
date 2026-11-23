import { isNull } from "drizzle-orm";
import type { CounterName } from "@clinic/shared";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { counters } from "../schema";

export type CounterRow = {
  name: CounterName;
  period: string;
  value: number;
};

/** 6.5.1: read-only number series for Settings (no edits). */
export function countersListRepo(db: Db, ctx: Ctx) {
  return {
    async list(): Promise<CounterRow[]> {
      assertAllowed(ctx, "settings.read");
      const rows = await db
        .select({
          name: counters.name,
          period: counters.period,
          value: counters.value,
        })
        .from(counters)
        .where(isNull(counters.deletedAt));
      return rows
        .map((r) => ({ name: r.name as CounterName, period: r.period, value: r.value }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.period.localeCompare(b.period));
    },
  };
}
