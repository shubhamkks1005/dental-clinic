import type { Bindings } from "../types";
import { runNightlyDailyStats } from "./daily-stats";
import { runMessagingTick } from "./messaging";

/** One cron trigger; each job is a fast branch (AGENTS.md / worker rules). */
export async function handleScheduled(
  _event: { scheduledTime: number; cron: string },
  env: Bindings,
): Promise<void> {
  const now = new Date(_event.scheduledTime);
  await runNightlyDailyStats(env, now);
  await runMessagingTick(env, now);
}
