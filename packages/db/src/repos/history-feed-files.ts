import type { FileKind } from "@clinic/shared";
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { files } from "../schema";
import { historyAtBounds } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(files.createdAt, after.at),
    and(eq(files.createdAt, after.at), lt(files.id, after.id)),
  );
}

/** 3.5.13 / 3.5.14 / 6.7.1: patient files in the feed. `kinds` null = all; [] = none. */
export function fileHistorySource(
  db: Db,
  opts?: { kinds?: readonly FileKind[] | null },
): HistorySource {
  const kinds = opts?.kinds;
  return {
    types: ["file"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      if (kinds && kinds.length === 0) return [];

      const f = q.filters;
      const rows = await db
        .select({
          id: files.id,
          createdAt: files.createdAt,
          kind: files.kind,
          mime: files.mime,
          patientId: files.patientId,
          toothFdi: files.toothFdi,
        })
        .from(files)
        .where(
          and(
            eq(files.patientId, q.patientId),
            isNull(files.deletedAt),
            afterClause(q.after),
            historyAtBounds(files.createdAt, f),
            kinds ? inArray(files.kind, [...kinds]) : undefined,
            f?.tooth != null ? eq(files.toothFdi, f.tooth) : undefined,
          ),
        )
        .orderBy(desc(files.createdAt), desc(files.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const tooth = r.toothFdi != null ? ` · tooth ${r.toothFdi}` : "";
        return {
          id: r.id,
          type: "file" as const,
          at: r.createdAt,
          summary: `${r.kind}${tooth} · ${r.mime}`,
          actorName: null,
          status: r.kind,
          href: `/app/patients/${r.patientId}?tab=files`,
        };
      });
    },
  };
}
