import { APPOINTMENT_BUSY_STATUSES } from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";

/** The toast offers Undo for 10 seconds; the server allows a little longer for a slow network. */
export const UNDO_CANCEL_SECONDS = 120;

// PA-M06 Undo after cancel. Only a "just cancelled" appointment goes back to scheduled. Clashes are
// allowed (owner 2026-11-26), so a time taken meanwhile does not stop it; only an exact repeat of
// the same patient, doctor and start does (checked in the same UPDATE). Nothing is deleted.
export function appointmentsUndoCancelRepo(db: Db, ctx: Ctx) {
  return {
    async undoCancel(id: string, version: number, now: Date = new Date()) {
      assertAllowed(ctx, "appointments.manage");
      const row = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That appointment");
      if (row.status !== "cancelled") {
        throw new ConflictError("That appointment is not cancelled any more.");
      }
      if (now.getTime() - new Date(row.updatedAt).getTime() > UNDO_CANCEL_SECONDS * 1000) {
        throw new InvalidError("Undo works only right after cancelling. Book the patient again.");
      }
      const busy = APPOINTMENT_BUSY_STATUSES.map((s) => sql`${s}`);
      const nowIso = now.toISOString();
      await db.batch([
        db
          .update(appointments)
          .set({
            status: "scheduled",
            cancelReason: null,
            version: sql`${appointments.version} + 1`,
            updatedAt: nowIso,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(appointments.id, id),
              eq(appointments.version, version),
              eq(appointments.status, "cancelled"),
              isNull(appointments.deletedAt),
              sql`NOT EXISTS (
                SELECT 1 FROM appointments o
                WHERE o.id <> ${id} AND o.patient_id = ${row.patientId}
                  AND o.doctor_id IS ${row.doctorId}
                  AND o.date_local = ${row.dateLocal} AND o.start_min = ${row.startMin}
                  AND o.deleted_at IS NULL AND o.status IN (${sql.join(busy, sql`, `)})
              )`,
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "appointments",
          rowId: id,
          before: { status: "cancelled", version: row.version },
          after: { status: "scheduled", undoCancel: true, version: row.version + 1 },
        }),
      ]);
      const next = await db
        .select({ status: appointments.status, version: appointments.version })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!next || next.status !== "scheduled" || next.version !== row.version + 1) {
        throw new ConflictError(
          "The patient was booked again at that time, or the appointment changed. Reload.",
        );
      }
      return { id, status: "scheduled" as const, version: next.version };
    },
  };
}
