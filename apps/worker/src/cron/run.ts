import type { Bindings } from "../types";
import { runNightlyDailyStats } from "./daily-stats";
import { runMessagingTick } from "./messaging";
import { runQuotaMonitor } from "./quota";
import { runRetentionPurge } from "./retention-purge";

/** One cron trigger; each job is a fast branch (AGENTS.md / worker rules). */
export async function handleScheduled(
  _event: { scheduledTime: number; cron: string },
  env: Bindings,
): Promise<void> {
  const now = new Date(_event.scheduledTime);
  await runNightlyDailyStats(env, now);
  await runMessagingTick(env, now);
  // Hourly-ish: run on :00 of each hour (cron is */5; skip other ticks).
  if (now.getUTCMinutes() < 5) {
    await runQuotaMonitor(env, now);
    await runRetentionPurge(env, now);
  }
}
