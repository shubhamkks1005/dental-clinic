import { and, desc, eq, isNull, ne } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { visits } from "../schema";

export type VisitDetail = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  visitDateLocal: string;
  status: "draft" | "final" | "void";
  chiefComplaint: string | null;
  historyNote: string | null;
  examNote: string | null;
  gumCondition: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  advice: string | null;
  nextVisitNote: string | null;
  finalisedAt: string | null;
  finalisedBy: string | null;
  snapshotHash: string | null;
  noDiagnosis: boolean;
  noProcedure: boolean;
  version: number;
};

/** Compact row for visit side panel (3.5.2). Void visits are omitted. */
export type VisitRecent = {
  id: string;
  visitDateLocal: string;
  status: "draft" | "final";
  chiefComplaint: string | null;
};

export const visitDetailCols = {
  id: visits.id,
  patientId: visits.patientId,
  appointmentId: visits.appointmentId,
  doctorId: visits.doctorId,
  visitDateLocal: visits.visitDateLocal,
  status: visits.status,
  chiefComplaint: visits.chiefComplaint,
  historyNote: visits.historyNote,
  examNote: visits.examNote,
  gumCondition: visits.gumCondition,
  bpSystolic: visits.bpSystolic,
  bpDiastolic: visits.bpDiastolic,
  pulse: visits.pulse,
  advice: visits.advice,
  nextVisitNote: visits.nextVisitNote,
  finalisedAt: visits.finalisedAt,
  finalisedBy: visits.finalisedBy,
  snapshotHash: visits.snapshotHash,
  noDiagnosis: visits.noDiagnosis,
  noProcedure: visits.noProcedure,
  version: visits.version,
};

const recentCols = {
  id: visits.id,
  visitDateLocal: visits.visitDateLocal,
  status: visits.status,
  chiefComplaint: visits.chiefComplaint,
};

const DEFAULT_RECENT = 3;
const MAX_RECENT = 10;

// 3.2.7 / 3.5.2: doctor-only clinical view. Receptionist has no clinical.view → ForbiddenError.
export function visitsGetRepo(db: Db, ctx: Ctx) {
  return {
    async getById(visitId: string): Promise<VisitDetail> {
      assertAllowed(ctx, "clinical.view");
      const row = await db
        .select(visitDetailCols)
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That visit");
      return row;
    },

    async listRecentByPatient(
      patientId: string,
      opts?: { limit?: number },
    ): Promise<VisitRecent[]> {
      assertAllowed(ctx, "clinical.view");
      const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_RECENT, 1), MAX_RECENT);
      const rows = await db
        .select(recentCols)
        .from(visits)
        .where(
          and(eq(visits.patientId, patientId), isNull(visits.deletedAt), ne(visits.status, "void")),
        )
        .orderBy(desc(visits.visitDateLocal), desc(visits.createdAt))
        .limit(limit)
        .all();
      return rows.map((r) => ({
        id: r.id,
        visitDateLocal: r.visitDateLocal,
        status: r.status as "draft" | "final",
        chiefComplaint: r.chiefComplaint,
      }));
    },
  };
}
