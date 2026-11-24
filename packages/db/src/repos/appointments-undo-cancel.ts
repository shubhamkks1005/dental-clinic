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

// PA-M06 Undo after cancel. Only a "just cancelled" appointment goes back to scheduled, and only
// if its time is still free (checked in the same UPDATE). Nothing is deleted; an audit row says so.
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
                WHERE o.id <> ${id} AND o.chair_id = ${row.chairId}
                  AND o.date_local = ${row.dateLocal} AND o.deleted_at IS NULL
                  AND o.status IN (${sql.join(busy, sql`, `)})
                  AND o.start_min < ${row.endMin} AND o.end_min > ${row.startMin}
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
          "That time was taken or the appointment changed. Book the patient again.",
        );
      }
      return { id, status: "scheduled" as const, version: next.version };
    },
  };
}
