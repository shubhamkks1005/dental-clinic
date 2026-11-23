import type { Repos } from "@clinic/db";
import { parseHistoryFeedQuery } from "@clinic/shared";

export async function getHistorySummary(repos: Repos, patientId: string) {
  const summary = await repos.history.getSummary(patientId);
  return { ok: true as const, summary };
}

export async function listHistoryFeed(repos: Repos, patientId: string, query: unknown) {
  const parsed = parseHistoryFeedQuery(query);
  if (!parsed.ok) return parsed;
  const page = await repos.history.listFeed(patientId, {
    cursor: parsed.value.cursor,
    limit: parsed.value.limit,
    chip: parsed.value.chip,
    from: parsed.value.from,
    to: parsed.value.to,
    tooth: parsed.value.tooth,
    q: parsed.value.q,
  });
  return { ok: true as const, ...page };
}
