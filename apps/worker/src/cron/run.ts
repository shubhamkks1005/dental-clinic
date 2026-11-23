import type { Bindings } from "../types";
import { runNightlyDailyStats } from "./daily-stats";

/** One cron trigger; each job is a fast branch (AGENTS.md / worker rules). */
export async function handleScheduled(
  _event: { scheduledTime: number; cron: string },
  env: Bindings,
): Promise<void> {
  const now = new Date(_event.scheduledTime);
  await runNightlyDailyStats(env, now);
  // Phase 7+ branches (messaging dispatcher, etc.) join here.
}
