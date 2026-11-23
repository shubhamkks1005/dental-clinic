import { formatRupees } from "@clinic/shared";
import { and, desc, eq, isNull, like, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { planItems } from "../schema";
import { historyAtBounds, historyLikePattern } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(planItems.createdAt, after.at),
    and(eq(planItems.createdAt, after.at), lt(planItems.id, after.id)),
  );
}

/** 3.5.13 / 6.7.1: treatment plan items in the merged history feed. */
export function treatmentHistorySource(db: Db): HistorySource {
  return {
    types: ["treatment"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const f = q.filters;
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
            historyAtBounds(planItems.createdAt, f),
            f?.tooth != null ? eq(planItems.toothFdi, f.tooth) : undefined,
            f?.q ? like(planItems.procedureLabel, historyLikePattern(f.q)) : undefined,
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
