import { createDb, createRepos } from "@clinic/db";
import { writeLog } from "../log";
import type { Bindings } from "../types";

export const QUOTA_WARN = 50_000;
export const QUOTA_FAIL = 80_000;
export const QUOTA_CRIT = 95_000;

export type QuotaEval = {
  requestCount: number;
  status: "ok" | "fail" | "unknown";
  threshold: "none" | "warn" | "fail" | "crit";
};

/** Pure thresholds (9.2.1). Live GraphQL count is injected until analytics token exists. */
export function evaluateQuota(requestCount: number): QuotaEval {
  if (requestCount >= QUOTA_CRIT) return { requestCount, status: "fail", threshold: "crit" };
  if (requestCount >= QUOTA_FAIL) return { requestCount, status: "fail", threshold: "fail" };
  if (requestCount >= QUOTA_WARN) return { requestCount, status: "ok", threshold: "warn" };
  return { requestCount, status: "ok", threshold: "none" };
}

/**
 * Hourly cron branch. Without CLOUDFLARE_ANALYTICS_TOKEN, count stays unknown (ops_status).
 * Tests pass `requestCount` via options.
 */
export async function runQuotaMonitor(
  env: Bindings,
  now: Date,
  options: { requestCount?: number } = {},
): Promise<QuotaEval> {
  const db = createDb(env.DB);
  const repos = createRepos(db, {
    userId: "system",
    role: "doctor",
    requestId: `cron-quota-${now.toISOString()}`,
  });

  let count = options.requestCount;
  if (count === undefined) {
    // Live GraphQL path waits on CLOUDFLARE_ANALYTICS_TOKEN (Waiting on owner).
    if (!env.CLOUDFLARE_ANALYTICS_TOKEN) {
      await repos.opsStatus.upsert({
        key: "quota",
        status: "unknown",
        checkedAt: now.toISOString(),
        detail: { note: "analytics_token_missing" },
      });
      writeLog("info", { msg: "cron_quota", threshold: "unknown" });
      return { requestCount: -1, status: "unknown", threshold: "none" };
    }
    count = await fetchWorkersRequestsToday(env);
  }

  const evaled = evaluateQuota(count);
  await repos.opsStatus.upsert({
    key: "quota",
    status: evaled.status,
    checkedAt: now.toISOString(),
    detail: { requestCount: count, threshold: evaled.threshold },
  });

  if (evaled.threshold === "fail" || evaled.threshold === "crit") {
    const url = env.HEALTHCHECKS_QUOTA_URL;
    if (url) {
      await fetch(`${url}/fail`, { method: "POST", body: `quota ${count}` }).catch(() => undefined);
    }
  }
  writeLog("info", { msg: "cron_quota", threshold: evaled.threshold, requestCount: count });
  return evaled;
}

async function fetchWorkersRequestsToday(env: Bindings): Promise<number> {
  // Placeholder until owner adds analytics token + account/script ids in wrangler vars.
  void env;
  return 0;
}
