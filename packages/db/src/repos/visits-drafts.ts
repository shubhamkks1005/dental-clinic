import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients, visits } from "../schema";

/** Draft visit reminder row for Today (3.5.8). Never auto-finalised. */
export type VisitDraftReminder = {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  visitDateLocal: string;
  chiefComplaint: string | null;
};

const MAX_DRAFTS = 50;

// 3.5.8: all open drafts (any day) so yesterday’s still show next morning.
export function visitsDraftsRepo(db: Db, ctx: Ctx) {
  return {
    async listDrafts(): Promise<VisitDraftReminder[]> {
      assertAllowed(ctx, "clinical.view");
      const rows = await db
        .select({
          id: visits.id,
          patientId: visits.patientId,
          patientCode: patients.code,
          patientName: patients.fullName,
          visitDateLocal: visits.visitDateLocal,
          chiefComplaint: visits.chiefComplaint,
        })
        .from(visits)
        .innerJoin(patients, eq(visits.patientId, patients.id))
        .where(and(eq(visits.status, "draft"), isNull(visits.deletedAt)))
        .orderBy(asc(visits.visitDateLocal), desc(visits.createdAt))
        .limit(MAX_DRAFTS)
        .all();
      return rows;
    },
  };
}
