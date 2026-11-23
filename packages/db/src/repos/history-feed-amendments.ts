import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { visitAddenda, visits } from "../schema";
import { historyAtBounds } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(visitAddenda.recordedAt, after.at),
    and(eq(visitAddenda.recordedAt, after.at), lt(visitAddenda.id, after.id)),
  );
}

/** 3.5.13: visit amendments / entered-in-error as separate feed rows. */
export function amendmentHistorySource(db: Db): HistorySource {
  return {
    types: ["amendment"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: visitAddenda.id,
          recordedAt: visitAddenda.recordedAt,
          kind: visitAddenda.kind,
          body: visitAddenda.body,
          reason: visitAddenda.reason,
          visitId: visitAddenda.visitId,
        })
        .from(visitAddenda)
        .innerJoin(visits, eq(visits.id, visitAddenda.visitId))
        .where(
          and(
            eq(visits.patientId, q.patientId),
            isNull(visits.deletedAt),
            isNull(visitAddenda.deletedAt),
            afterClause(q.after),
            historyAtBounds(visitAddenda.recordedAt, q.filters),
          ),
        )
        .orderBy(desc(visitAddenda.recordedAt), desc(visitAddenda.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const preview = r.body.trim().slice(0, 80);
        const label = r.kind === "entered_in_error" ? "Entered in error" : "Amendment";
        return {
          id: r.id,
          type: "amendment" as const,
          at: r.recordedAt,
          summary: `${label}: ${preview}${r.body.trim().length > 80 ? "…" : ""}`,
          actorName: null,
          status: r.kind,
          href: `/app/visits/${r.visitId}`,
        };
      });
    },
  };
}
