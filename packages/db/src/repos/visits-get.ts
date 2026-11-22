import { and, eq, isNull } from "drizzle-orm";
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
  version: number;
};

const detailCols = {
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
  version: visits.version,
};

// 3.2.7: doctor-only clinical view. Receptionist has no clinical.view → ForbiddenError.
export function visitsGetRepo(db: Db, ctx: Ctx) {
  return {
    async getById(visitId: string): Promise<VisitDetail> {
      assertAllowed(ctx, "clinical.view");
      const row = await db
        .select(detailCols)
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That visit");
      return row;
    },
  };
}
