import { newUlid, type OpenVisitInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, patients, visits } from "../schema";
import { insertVisitIfAppointmentFree } from "./visit-insert";

export type VisitRow = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  visitDateLocal: string;
  status: "draft" | "final" | "void";
  version: number;
};

const visitCols = {
  id: visits.id,
  patientId: visits.patientId,
  appointmentId: visits.appointmentId,
  doctorId: visits.doctorId,
  visitDateLocal: visits.visitDateLocal,
  status: visits.status,
  version: visits.version,
};

// 3.2.1 / 3.5.1: return the live visit for an appointment, or create a draft. A second create
// for the same appointment does not insert (INSERT…WHERE NOT EXISTS + unique index).
export function visitsOpenRepo(db: Db, ctx: Ctx) {
  return {
    async open(input: OpenVisitInput): Promise<VisitRow> {
      assertAllowed(ctx, "clinical.edit");

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const appointmentId = input.appointmentId ?? null;

      if (appointmentId) {
        const appt = await db
          .select({ id: appointments.id, patientId: appointments.patientId })
          .from(appointments)
          .where(and(eq(appointments.id, appointmentId), isNull(appointments.deletedAt)))
          .get();
        if (!appt) throw new NotFoundError("That appointment");
        if (appt.patientId !== input.patientId) {
          throw new ConflictError("That appointment belongs to a different patient.");
        }

        const existing = await db
          .select(visitCols)
          .from(visits)
          .where(and(eq(visits.appointmentId, appointmentId), isNull(visits.deletedAt)))
          .get();
        if (existing) return existing;
      } else {
        // 3.5.1: profile / walk-in "New visit" reuses today's draft for this patient.
        const existingDraft = await db
          .select(visitCols)
          .from(visits)
          .where(
            and(
              eq(visits.patientId, input.patientId),
              eq(visits.visitDateLocal, input.visitDateLocal),
              eq(visits.status, "draft"),
              isNull(visits.deletedAt),
            ),
          )
          .get();
        if (existingDraft) return existingDraft;
      }

      const id = newUlid();
      await db.batch([
        insertVisitIfAppointmentFree(db, {
          id,
          patientId: input.patientId,
          appointmentId,
          doctorId: ctx.userId,
          visitDateLocal: input.visitDateLocal,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "visits",
          rowId: id,
          after: {
            patientId: input.patientId,
            appointmentId,
            status: "draft",
            visitDateLocal: input.visitDateLocal,
          },
        }),
      ]);

      const row = await db.select(visitCols).from(visits).where(eq(visits.id, id)).get();
      if (row) return row;

      // Lost race: another draft won the appointment slot — return that one (no second audit).
      if (appointmentId) {
        const winner = await db
          .select(visitCols)
          .from(visits)
          .where(and(eq(visits.appointmentId, appointmentId), isNull(visits.deletedAt)))
          .get();
        if (winner) return winner;
      }
      throw new ConflictError("Could not open the visit. Try again.");
    },
  };
}
