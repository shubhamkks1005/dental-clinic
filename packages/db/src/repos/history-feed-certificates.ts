import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { certificates, users } from "../schema";
import { historyAtBounds } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(certificates.finalisedAt, after.at),
    and(eq(certificates.finalisedAt, after.at), lt(certificates.id, after.id)),
  );
}

/**
 * 4.4.3: finalised/revised certificates in History.
 * Receptionist summary has cert number only (no diagnosis/reason clinical detail beyond label).
 */
export function certificateHistorySource(
  db: Db,
  opts: { includeClinical: boolean },
): HistorySource {
  return {
    types: ["certificate"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: certificates.id,
          finalisedAt: certificates.finalisedAt,
          createdAt: certificates.createdAt,
          status: certificates.status,
          certNo: certificates.certNo,
          reason: certificates.reason,
          doctorName: users.name,
        })
        .from(certificates)
        .leftJoin(users, eq(users.id, certificates.doctorId))
        .where(
          and(
            eq(certificates.patientId, q.patientId),
            isNull(certificates.deletedAt),
            inArray(certificates.status, ["finalised", "revised"]),
            afterClause(q.after),
            historyAtBounds(certificates.finalisedAt, q.filters),
          ),
        )
        .orderBy(desc(certificates.finalisedAt), desc(certificates.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const at = r.finalisedAt ?? r.createdAt;
        const label = r.certNo ?? "Certificate";
        const summary =
          opts.includeClinical && r.reason
            ? `${label}: ${r.reason.slice(0, 80)}${r.reason.length > 80 ? "…" : ""}`
            : label;
        return {
          id: r.id,
          type: "certificate" as const,
          at,
          summary,
          actorName: r.doctorName ?? null,
          status: r.status,
          href: `/app/print/certificate/${r.id}`,
        };
      });
    },
  };
}
