import { createDb, createRepos, type Ctx } from "@clinic/db";
import { shouldRunNightlyStats } from "@clinic/shared";
import { writeLog } from "../log";
import type { Bindings } from "../types";

/** System actor for scheduled jobs (reports.full via doctor role). */
const CRON_CTX: Ctx = { userId: "system", role: "doctor", requestId: "cron-daily-stats" };

export async function runNightlyDailyStats(
  env: Bindings,
  now: Date = new Date(),
): Promise<{ ran: boolean; days?: string[] }> {
  if (!shouldRunNightlyStats(now)) return { ran: false };
  const db = createDb(env.DB);
  const repos = createRepos(db, { ...CRON_CTX, requestId: `cron-stats-${now.toISOString()}` });
  const { days } = await repos.dailyStats.recomputeRecentDays(now, { rateLimit: false, days: 3 });
  writeLog("info", { msg: "cron_daily_stats", days: days.length });
  return { ran: true, days };
}
