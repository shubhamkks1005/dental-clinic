import type { Repos } from "@clinic/db";

export function listCounters(repos: Repos) {
  return repos.counters.list();
}
