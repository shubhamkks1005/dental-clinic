import type { HistoryFeedFilters } from "@clinic/shared";
import { and, gte, lt, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm/column";

/** SQL bounds for an ISO `*_at` column from 6.7.1 date filters. */
export function historyAtBounds(
  col: AnyColumn,
  filters: HistoryFeedFilters | undefined,
): SQL | undefined {
  if (!filters) return undefined;
  const parts: SQL[] = [];
  if (filters.fromAt) parts.push(gte(col, filters.fromAt));
  if (filters.toAtExclusive) parts.push(lt(col, filters.toAtExclusive));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
}

/** Escape LIKE wildcards; SQLite LIKE is ASCII case-insensitive. */
export function historyLikePattern(q: string): string {
  return `%${q.replace(/[%_]/g, "")}%`;
}
