import { and, asc, desc, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";
import type { Db } from "../client";
import { users, visitDiagnoses, visits } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(visits.createdAt, after.at),
    and(eq(visits.createdAt, after.at), lt(visits.id, after.id)),
  );
}

/** 3.5.12 / 3.5.13: visits with complaint, diagnosis, doctor, draft|finalised. */
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
          doctorName: users.name,
        })
        .from(visits)
        .leftJoin(users, eq(users.id, visits.doctorId))
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

      const dxByVisit = new Map<string, string>();
      if (rows.length > 0) {
        const dxRows = await db
          .select({
            visitId: visitDiagnoses.visitId,
            label: visitDiagnoses.label,
            sortOrder: visitDiagnoses.sortOrder,
          })
          .from(visitDiagnoses)
          .where(
            and(
              inArray(
                visitDiagnoses.visitId,
                rows.map((r) => r.id),
              ),
              isNull(visitDiagnoses.deletedAt),
            ),
          )
          .orderBy(asc(visitDiagnoses.sortOrder))
          .all();
        for (const d of dxRows) {
          if (!dxByVisit.has(d.visitId)) dxByVisit.set(d.visitId, d.label);
        }
      }

      return rows.map((r) => {
        const complaint = r.chiefComplaint?.trim();
        const dx = dxByVisit.get(r.id);
        const parts = [complaint || `Visit · ${r.visitDateLocal}`, dx ? `Dx: ${dx}` : null].filter(
          Boolean,
        );
        return {
          id: r.id,
          type: "visit" as const,
          at: r.createdAt,
          summary: parts.join(" · "),
          actorName: r.doctorName ?? null,
          status: r.status,
          href: `/app/visits/${r.id}`,
        };
      });
    },
  };
}
