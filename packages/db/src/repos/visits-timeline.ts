import { and, desc, eq, inArray, isNull, like, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { visitDiagnoses, visitProcedures, visits } from "../schema";

export type VisitTimelineRow = {
  id: string;
  visitDateLocal: string;
  status: "draft" | "final";
  chiefComplaint: string | null;
  diagnoses: string[];
  procedures: string[];
};

export type VisitTimelineFilter = {
  limit?: number;
  diagnosis?: string;
  procedure?: string;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function normFilter(raw: string | undefined): string | null {
  const t = raw?.trim().toLowerCase() ?? "";
  return t.length > 0 ? t : null;
}

// 3.5.9: patient visit timeline, newest first, optional diagnosis/procedure text filters.
export function visitsTimelineRepo(db: Db, ctx: Ctx) {
  return {
    async listTimelineByPatient(
      patientId: string,
      opts?: VisitTimelineFilter,
    ): Promise<VisitTimelineRow[]> {
      assertAllowed(ctx, "clinical.view");
      const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      const diagnosisQ = normFilter(opts?.diagnosis);
      const procedureQ = normFilter(opts?.procedure);

      let visitIds: string[] | null = null;
      if (diagnosisQ) {
        const matched = await db
          .selectDistinct({ visitId: visitDiagnoses.visitId })
          .from(visitDiagnoses)
          .innerJoin(visits, eq(visitDiagnoses.visitId, visits.id))
          .where(
            and(
              eq(visits.patientId, patientId),
              isNull(visits.deletedAt),
              ne(visits.status, "void"),
              isNull(visitDiagnoses.deletedAt),
              like(sql`lower(${visitDiagnoses.label})`, `%${diagnosisQ}%`),
            ),
          )
          .all();
        visitIds = matched.map((r) => r.visitId);
        if (visitIds.length === 0) return [];
      }
      if (procedureQ) {
        const matched = await db
          .selectDistinct({ visitId: visitProcedures.visitId })
          .from(visitProcedures)
          .innerJoin(visits, eq(visitProcedures.visitId, visits.id))
          .where(
            and(
              eq(visits.patientId, patientId),
              isNull(visits.deletedAt),
              ne(visits.status, "void"),
              isNull(visitProcedures.deletedAt),
              like(sql`lower(${visitProcedures.label})`, `%${procedureQ}%`),
              visitIds ? inArray(visitProcedures.visitId, visitIds) : undefined,
            ),
          )
          .all();
        visitIds = matched.map((r) => r.visitId);
        if (visitIds.length === 0) return [];
      }

      const rows = await db
        .select({
          id: visits.id,
          visitDateLocal: visits.visitDateLocal,
          status: visits.status,
          chiefComplaint: visits.chiefComplaint,
        })
        .from(visits)
        .where(
          and(
            eq(visits.patientId, patientId),
            isNull(visits.deletedAt),
            ne(visits.status, "void"),
            visitIds ? inArray(visits.id, visitIds) : undefined,
          ),
        )
        .orderBy(desc(visits.visitDateLocal), desc(visits.createdAt))
        .limit(limit)
        .all();

      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.id);
      const [dxRows, pxRows] = await Promise.all([
        db
          .select({
            visitId: visitDiagnoses.visitId,
            label: visitDiagnoses.label,
          })
          .from(visitDiagnoses)
          .where(and(inArray(visitDiagnoses.visitId, ids), isNull(visitDiagnoses.deletedAt)))
          .all(),
        db
          .select({
            visitId: visitProcedures.visitId,
            label: visitProcedures.label,
          })
          .from(visitProcedures)
          .where(and(inArray(visitProcedures.visitId, ids), isNull(visitProcedures.deletedAt)))
          .all(),
      ]);

      const dxBy = new Map<string, string[]>();
      for (const d of dxRows) {
        const list = dxBy.get(d.visitId) ?? [];
        list.push(d.label);
        dxBy.set(d.visitId, list);
      }
      const pxBy = new Map<string, string[]>();
      for (const p of pxRows) {
        const list = pxBy.get(p.visitId) ?? [];
        list.push(p.label);
        pxBy.set(p.visitId, list);
      }

      return rows.map((r) => ({
        id: r.id,
        visitDateLocal: r.visitDateLocal,
        status: r.status as "draft" | "final",
        chiefComplaint: r.chiefComplaint,
        diagnoses: dxBy.get(r.id) ?? [],
        procedures: pxBy.get(r.id) ?? [],
      }));
    },
  };
}
