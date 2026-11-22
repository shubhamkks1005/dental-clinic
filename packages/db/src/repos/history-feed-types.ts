import type { HistoryCursor, HistoryEntryType } from "@clinic/shared";

/** One merged history row (3.5.12). */
export type HistoryFeedEntry = {
  id: string;
  type: HistoryEntryType;
  /** ISO UTC sort key (newest first). */
  at: string;
  summary: string;
  actorName: string | null;
  status: string | null;
  href: string;
};

export type HistoryFeedPage = {
  entries: HistoryFeedEntry[];
  nextCursor: string | null;
};

export type HistorySourceQuery = {
  patientId: string;
  /** Fetch this many from each source before merge. */
  take: number;
  after: HistoryCursor | null;
};

export type HistorySource = {
  list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]>;
};
