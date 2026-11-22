import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { consents } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

const TYPE_LABEL: Record<string, string> = {
  privacy_notice: "Privacy notice",
  sms_reminders: "SMS reminders",
  marketing: "Marketing",
  treatment: "Treatment",
  photo: "Photo",
  portal: "Portal",
};

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(consents.givenAt, after.at),
    and(eq(consents.givenAt, after.at), lt(consents.id, after.id)),
  );
}

/** 3.5.13: consents given or withdrawn. */
export function consentHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: consents.id,
          givenAt: consents.givenAt,
          type: consents.type,
          given: consents.given,
          patientId: consents.patientId,
        })
        .from(consents)
        .where(
          and(
            eq(consents.patientId, q.patientId),
            isNull(consents.deletedAt),
            afterClause(q.after),
          ),
        )
        .orderBy(desc(consents.givenAt), desc(consents.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const label = TYPE_LABEL[r.type] ?? r.type;
        return {
          id: r.id,
          type: "consent" as const,
          at: r.givenAt,
          summary: r.given ? `${label} given` : `${label} withdrawn`,
          actorName: null,
          status: r.given ? "given" : "withdrawn",
          href: `/app/patients/${r.patientId}/consents`,
        };
      });
    },
  };
}
