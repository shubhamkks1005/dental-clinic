import { writeLog } from "../log";
import type { Bindings } from "../types";
import { runNightlyDailyStats } from "./daily-stats";
import { runMessagingTick } from "./messaging";
import { runQuotaMonitor } from "./quota";
import { isPurgeTick, runRetentionPurge } from "./retention-purge";

/** One job failing must not stop the others. Log only the job id and error type (no message: it may hold patient data). */
async function runJob(job: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    writeLog("error", {
      event: "cron_job_failed",
      job,
      errorType: err instanceof Error ? err.name : typeof err,
    });
  }
}

/** One cron trigger; each job is a fast branch (AGENTS.md / worker rules). */
export async function handleScheduled(
  _event: { scheduledTime: number; cron: string },
  env: Bindings,
): Promise<void> {
  const now = new Date(_event.scheduledTime);
  await runJob("stats", () => runNightlyDailyStats(env, now));
  await runJob("messaging", () => runMessagingTick(env, now));
  // Hourly-ish: run on :00 of each hour (cron is */5; skip other ticks).
  if (now.getUTCMinutes() < 5) {
    await runJob("quota", () => runQuotaMonitor(env, now));
  }
  if (isPurgeTick(now)) await runJob("retention", () => runRetentionPurge(env, now));
}
