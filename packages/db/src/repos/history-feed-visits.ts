import { and, asc, desc, eq, exists, inArray, isNull, like, lt, ne, or, sql } from "drizzle-orm";
import type { Db } from "../client";
import { users, visitDiagnoses, visitProcedures, visits } from "../schema";
import { historyAtBounds, historyLikePattern } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(visits.createdAt, after.at),
    and(eq(visits.createdAt, after.at), lt(visits.id, after.id)),
  );
}

/** 3.5.12 / 3.5.13 / 6.7.1: visits with complaint, diagnosis, doctor, draft|finalised. */
export function visitHistorySource(db: Db): HistorySource {
  return {
    types: ["visit"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const f = q.filters;
      const tooth = f?.tooth ?? null;
      const textQ = f?.q ?? null;

      const toothExists =
        tooth != null
          ? or(
              exists(
                db
                  .select({ x: sql`1` })
                  .from(visitDiagnoses)
                  .where(
                    and(
                      eq(visitDiagnoses.visitId, visits.id),
                      eq(visitDiagnoses.toothFdi, tooth),
                      isNull(visitDiagnoses.deletedAt),
                    ),
                  ),
              ),
              exists(
                db
                  .select({ x: sql`1` })
                  .from(visitProcedures)
                  .where(
                    and(
                      eq(visitProcedures.visitId, visits.id),
                      eq(visitProcedures.toothFdi, tooth),
                      isNull(visitProcedures.deletedAt),
                    ),
                  ),
              ),
            )
          : undefined;

      const textExists =
        textQ != null
          ? or(
              like(visits.chiefComplaint, historyLikePattern(textQ)),
              exists(
                db
                  .select({ x: sql`1` })
                  .from(visitDiagnoses)
                  .where(
                    and(
                      eq(visitDiagnoses.visitId, visits.id),
                      like(visitDiagnoses.label, historyLikePattern(textQ)),
                      isNull(visitDiagnoses.deletedAt),
                    ),
                  ),
              ),
            )
          : undefined;

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
            historyAtBounds(visits.createdAt, f),
            toothExists,
            textExists,
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
