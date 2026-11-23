import type { Repos } from "@clinic/db";
import type { DashboardPayload, DashboardRangeQuery } from "@clinic/shared";

/** Aggregates only (no patient names); 6.3.1 Cache-Control for GET /dashboard. */
export const DASHBOARD_CACHE_CONTROL = "private, max-age=60";

/** 6.3.1: doctor dashboard prepared arrays. */
export async function getDashboard(
  repos: Repos,
  query: DashboardRangeQuery,
  now: Date = new Date(),
): Promise<DashboardPayload> {
  return repos.dashboard.get(query, now);
}
