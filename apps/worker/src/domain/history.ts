import type { Repos } from "@clinic/db";

export async function getHistorySummary(repos: Repos, patientId: string) {
  const summary = await repos.history.getSummary(patientId);
  return { ok: true as const, summary };
}
