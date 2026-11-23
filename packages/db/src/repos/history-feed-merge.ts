import { encodeHistoryCursor, type HistoryCursor, type HistoryFeedFilters } from "@clinic/shared";
import type { HistoryFeedEntry, HistoryFeedPage, HistorySource } from "./history-feed-types";

function newer(a: HistoryFeedEntry, b: HistoryFeedEntry): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Merge source pages newest-first and build the next cursor (3.5.12 / 6.7.1). */
export async function mergeHistorySources(
  sources: HistorySource[],
  opts: {
    patientId: string;
    limit: number;
    after: HistoryCursor | null;
    filters?: HistoryFeedFilters;
  },
): Promise<HistoryFeedPage> {
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const take = limit + 1;
  const batches = await Promise.all(
    sources.map((s) =>
      s.list({
        patientId: opts.patientId,
        take,
        after: opts.after,
        filters: opts.filters,
      }),
    ),
  );
  const merged = batches.flat().sort(newer);
  const page = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? encodeHistoryCursor({ at: last.at, id: last.id }) : null;
  return { entries: page, nextCursor };
}
