import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { medicalHistory } from "../schema";
import { historyAtBounds } from "./history-feed-bounds";
import { summariseMedicalChange } from "./history-feed-medical-diff";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(medicalHistory.recordedAt, after.at),
    and(eq(medicalHistory.recordedAt, after.at), lt(medicalHistory.id, after.id)),
  );
}

/** 3.5.13: medical history / allergy version changes. */
export function medicalChangeHistorySource(db: Db): HistorySource {
  return {
    types: ["medical_change"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: medicalHistory.id,
          recordedAt: medicalHistory.recordedAt,
          versionNo: medicalHistory.versionNo,
          answersJson: medicalHistory.answersJson,
          patientId: medicalHistory.patientId,
        })
        .from(medicalHistory)
        .where(
          and(
            eq(medicalHistory.patientId, q.patientId),
            isNull(medicalHistory.deletedAt),
            afterClause(q.after),
            historyAtBounds(medicalHistory.recordedAt, q.filters),
          ),
        )
        .orderBy(desc(medicalHistory.recordedAt), desc(medicalHistory.id))
        .limit(q.take)
        .all();

      const prevNos = [...new Set(rows.map((r) => r.versionNo - 1).filter((n) => n >= 1))];
      const prevByNo = new Map<number, string>();
      if (prevNos.length > 0) {
        const prevRows = await db
          .select({
            versionNo: medicalHistory.versionNo,
            answersJson: medicalHistory.answersJson,
          })
          .from(medicalHistory)
          .where(
            and(
              eq(medicalHistory.patientId, q.patientId),
              isNull(medicalHistory.deletedAt),
              inArray(medicalHistory.versionNo, prevNos),
            ),
          )
          .all();
        for (const p of prevRows) prevByNo.set(p.versionNo, p.answersJson);
      }

      return rows.map((r) => ({
        id: r.id,
        type: "medical_change" as const,
        at: r.recordedAt,
        summary: summariseMedicalChange(prevByNo.get(r.versionNo - 1) ?? null, r.answersJson),
        actorName: null,
        status: `v${r.versionNo}`,
        href: `/app/patients/${r.patientId}?tab=overview`,
      }));
    },
  };
}
