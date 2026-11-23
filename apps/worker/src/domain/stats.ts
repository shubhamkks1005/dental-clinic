import type { Repos } from "@clinic/db";

/** 6.2.3: doctor "Recompute now" — last 3 IST days, rate-limited in the repo. */
export async function recomputeStats(repos: Repos, now: Date = new Date()) {
  const result = await repos.dailyStats.recomputeRecentDays(now, {
    rateLimit: true,
    days: 3,
  });
  return { ok: true as const, days: result.days };
}
