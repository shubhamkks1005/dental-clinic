import type { PatchVisitInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { visits } from "../schema";
import { nowUtcSql } from "../sql";
import type { VisitDetail } from "./visits-get";

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

type DraftFields = Omit<PatchVisitInput, "version">;

/**
 * 3.5.3 / 3.5.5: patch draft clinical fields. No audit row per patch (PLAN exception —
 * audit only on open, finalise, addendum, entered-in-error).
 */
export function visitsPatchRepo(db: Db, ctx: Ctx) {
  return {
    async updateDraftFields(
      visitId: string,
      version: number,
      fields: DraftFields,
    ): Promise<VisitDetail> {
      assertAllowed(ctx, "clinical.edit");
      const visit = await db
        .select({ id: visits.id, status: visits.status, version: visits.version })
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      if (visit.status !== "draft") {
        throw new InvalidError("This visit is finalised. Add an addendum instead of editing it.");
      }
      if (visit.version !== version) throw new ConflictError();

      const patch: Record<string, string | number | null> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) patch[key] = value as string | number | null;
      }
      if (Object.keys(patch).length === 0) {
        const current = await db
          .select(detailCols)
          .from(visits)
          .where(eq(visits.id, visitId))
          .get();
        if (!current) throw new NotFoundError("That visit");
        return current;
      }

      await db
        .update(visits)
        .set({
          ...patch,
          version: version + 1,
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
        })
        .where(
          and(eq(visits.id, visitId), eq(visits.version, version), eq(visits.status, "draft")),
        );

      const row = await db.select(detailCols).from(visits).where(eq(visits.id, visitId)).get();
      if (!row || row.version !== version + 1) {
        throw new ConflictError("Could not save. Reload the visit and try again.");
      }
      return row;
    },
  };
}
