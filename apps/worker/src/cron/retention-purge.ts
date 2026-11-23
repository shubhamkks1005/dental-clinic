import { createDb, createRepos, type PurgeResult } from "@clinic/db";
import { writeLog } from "../log";
import type { Bindings } from "../types";

const CRON_CTX = { userId: "system", role: "doctor" as const };

/** Once a day at 02:00 IST (20:30 UTC), in the first 5 minutes, so a dry run adds at most one audit row a day. */
export function isPurgeTick(now: Date): boolean {
  return now.getUTCHours() === 20 && now.getUTCMinutes() >= 30 && now.getUTCMinutes() < 35;
}

/** Live only when RETENTION_MODE is exactly "live". Anything else is a dry run. */
export const purgeIsLive = (env: Bindings) => env.RETENTION_MODE === "live";

/**
 * 9.3.10: purge old operational rows (messages, error log) as decided in docs/RETENTION.md.
 * Patient, clinical and billing records are never touched. Rules live in packages/db.
 */
export async function runRetentionPurge(env: Bindings, now: Date): Promise<PurgeResult> {
  const repos = createRepos(createDb(env.DB), {
    ...CRON_CTX,
    requestId: `cron-retention-${now.toISOString()}`,
  });
  const result = await repos.retention.purge(now, purgeIsLive(env));
  writeLog("info", { msg: "cron_retention_purge", mode: result.mode, total: result.total });
  return result;
}
