import { formatRupees } from "@clinic/shared";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { planItems } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(planItems.createdAt, after.at),
    and(eq(planItems.createdAt, after.at), lt(planItems.id, after.id)),
  );
}

/** 3.5.13: treatment plan items in the merged history feed. */
export function treatmentHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: planItems.id,
          createdAt: planItems.createdAt,
          procedureLabel: planItems.procedureLabel,
          toothFdi: planItems.toothFdi,
          status: planItems.status,
          estimatePaise: planItems.estimatePaise,
          patientId: planItems.patientId,
        })
        .from(planItems)
        .where(
          and(
            eq(planItems.patientId, q.patientId),
            isNull(planItems.deletedAt),
            afterClause(q.after),
          ),
        )
        .orderBy(desc(planItems.createdAt), desc(planItems.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const tooth = r.toothFdi != null ? ` · tooth ${r.toothFdi}` : "";
        return {
          id: r.id,
          type: "treatment" as const,
          at: r.createdAt,
          summary: `${r.procedureLabel}${tooth} · ${formatRupees(r.estimatePaise)}`,
          actorName: null,
          status: r.status,
          href: `/app/patients/${r.patientId}?tab=chart`,
        };
      });
    },
  };
}
