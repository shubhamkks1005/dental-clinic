import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { files } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(files.createdAt, after.at),
    and(eq(files.createdAt, after.at), lt(files.id, after.id)),
  );
}

/** 3.5.13: patient files in the feed (empty until 3.7 upload fills the table). */
export function fileHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: files.id,
          createdAt: files.createdAt,
          kind: files.kind,
          mime: files.mime,
          patientId: files.patientId,
        })
        .from(files)
        .where(and(eq(files.patientId, q.patientId), isNull(files.deletedAt), afterClause(q.after)))
        .orderBy(desc(files.createdAt), desc(files.id))
        .limit(q.take)
        .all();

      return rows.map((r) => ({
        id: r.id,
        type: "file" as const,
        at: r.createdAt,
        summary: `${r.kind} · ${r.mime}`,
        actorName: null,
        status: r.kind,
        href: `/app/patients/${r.patientId}?tab=files`,
      }));
    },
  };
}
