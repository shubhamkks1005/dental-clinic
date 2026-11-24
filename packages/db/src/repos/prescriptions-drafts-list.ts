import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients, prescriptions, visits } from "../schema";

/** A prescription started but not issued: a line for the doctor's "Waiting for you" on Today. */
export type DraftPrescriptionReminder = {
  id: string;
  visitId: string | null;
  patientId: string;
  patientName: string;
  visitDateLocal: string | null;
};

const MAX_DRAFT_RX = 50;

export function prescriptionsDraftsListRepo(db: Db, ctx: Ctx) {
  return {
    /** Draft prescriptions of any day, newest first. Doctor only (same right as writing one). */
    async listDrafts(): Promise<DraftPrescriptionReminder[]> {
      assertAllowed(ctx, "prescriptions.write");
      return db
        .select({
          id: prescriptions.id,
          visitId: prescriptions.visitId,
          patientId: prescriptions.patientId,
          patientName: patients.fullName,
          visitDateLocal: visits.visitDateLocal,
        })
        .from(prescriptions)
        .innerJoin(patients, eq(prescriptions.patientId, patients.id))
        .leftJoin(visits, eq(prescriptions.visitId, visits.id))
        .where(and(eq(prescriptions.status, "draft"), isNull(prescriptions.deletedAt)))
        .orderBy(desc(prescriptions.createdAt))
        .limit(MAX_DRAFT_RX)
        .all();
    },
  };
}
