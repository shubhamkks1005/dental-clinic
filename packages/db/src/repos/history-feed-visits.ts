import { and, desc, eq, isNull, lt, ne, or } from "drizzle-orm";
import type { Db } from "../client";
import { visits } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(visits.createdAt, after.at),
    and(eq(visits.createdAt, after.at), lt(visits.id, after.id)),
  );
}

export function visitHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: visits.id,
          createdAt: visits.createdAt,
          visitDateLocal: visits.visitDateLocal,
          status: visits.status,
          chiefComplaint: visits.chiefComplaint,
        })
        .from(visits)
        .where(
          and(
            eq(visits.patientId, q.patientId),
            isNull(visits.deletedAt),
            ne(visits.status, "void"),
            afterClause(q.after),
          ),
        )
        .orderBy(desc(visits.createdAt), desc(visits.id))
        .limit(q.take)
        .all();

      return rows.map((r) => ({
        id: r.id,
        type: "visit" as const,
        at: r.createdAt,
        summary: r.chiefComplaint?.trim() || `Visit · ${r.visitDateLocal}`,
        actorName: null,
        status: r.status,
        href: `/app/visits/${r.id}`,
      }));
    },
  };
}
