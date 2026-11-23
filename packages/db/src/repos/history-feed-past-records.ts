import { istDate } from "@clinic/shared";
import { and, desc, eq, isNull, lt, or, gte } from "drizzle-orm";
import type { Db } from "../client";
import { pastRecords } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";
import { pastRecordFeedAt } from "./past-records";

/** 6.7.3: past/paper notes in the merged History feed (sorted by historical date). */
export function pastRecordHistorySource(db: Db): HistorySource {
  return {
    types: ["past_record"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const f = q.filters;
      const afterOn = q.after ? istDate(new Date(q.after.at)) : null;
      const fromOn = f?.fromAt ? istDate(new Date(f.fromAt)) : null;
      const toOnExclusive = f?.toAtExclusive ? istDate(new Date(f.toAtExclusive)) : null;

      const rows = await db
        .select({
          id: pastRecords.id,
          recordedOn: pastRecords.recordedOn,
          body: pastRecords.body,
          fileId: pastRecords.fileId,
          patientId: pastRecords.patientId,
        })
        .from(pastRecords)
        .where(
          and(
            eq(pastRecords.patientId, q.patientId),
            isNull(pastRecords.deletedAt),
            afterOn
              ? or(
                  lt(pastRecords.recordedOn, afterOn),
                  and(eq(pastRecords.recordedOn, afterOn), lt(pastRecords.id, q.after!.id)),
                )
              : undefined,
            fromOn ? gte(pastRecords.recordedOn, fromOn) : undefined,
            toOnExclusive ? lt(pastRecords.recordedOn, toOnExclusive) : undefined,
          ),
        )
        .orderBy(desc(pastRecords.recordedOn), desc(pastRecords.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const preview = r.body.trim().slice(0, 80);
        const more = r.body.trim().length > 80 ? "…" : "";
        const scan = r.fileId ? " · with scan" : "";
        return {
          id: r.id,
          type: "past_record" as const,
          at: pastRecordFeedAt(r.recordedOn),
          summary: `${preview}${more}${scan}`,
          actorName: null,
          status: "Added later",
          href: `/app/patients/${r.patientId}?tab=history`,
        };
      });
    },
  };
}
