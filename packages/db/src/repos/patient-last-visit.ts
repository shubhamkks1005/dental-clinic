import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { visitProcedures, visits } from "../schema";

export type LastVisit = { dateLocal: string; procedures: string[] } | null;

const MAX_LABELS = 3;

// Booking details panel, doctor only (clinical): "Last visit 12 Nov: Scaling" or "First visit".
// Two small reads: the newest final visit, then up to three of its procedure names.
export function patientLastVisitRepo(db: Db, ctx: Ctx) {
  return {
    async lastVisit(patientId: string): Promise<LastVisit> {
      assertAllowed(ctx, "clinical.view");
      const visit = await db
        .select({ id: visits.id, dateLocal: visits.visitDateLocal })
        .from(visits)
        .where(
          and(
            eq(visits.patientId, patientId),
            eq(visits.status, "final"),
            isNull(visits.deletedAt),
          ),
        )
        .orderBy(desc(visits.visitDateLocal), desc(visits.createdAt))
        .get();
      if (!visit) return null;
      const lines = await db
        .select({ label: visitProcedures.label })
        .from(visitProcedures)
        .where(and(inArray(visitProcedures.visitId, [visit.id]), isNull(visitProcedures.deletedAt)))
        .orderBy(asc(visitProcedures.sortOrder))
        .all();
      const labels = [...new Set(lines.map((l) => l.label))].slice(0, MAX_LABELS);
      return { dateLocal: visit.dateLocal, procedures: labels };
    },
  };
}
