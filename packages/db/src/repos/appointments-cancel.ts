import {
  formatCancelReason,
  isAllowedStatusTransition,
  type AppointmentStatus,
  type CancelAppointmentInput,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";

// 2.3.8 cancel with reason list. notifyPatient is audited until events (2.5.1).
export function appointmentsCancelRepo(db: Db, ctx: Ctx) {
  return {
    async cancel(id: string, input: CancelAppointmentInput) {
      assertAllowed(ctx, "appointments.manage");
      const row = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That appointment");
      const from = row.status as AppointmentStatus;
      if (!isAllowedStatusTransition(from, "cancelled")) {
        throw new ConflictError("That appointment cannot be cancelled from its current status.");
      }
      const cancelReason = formatCancelReason(input.reason, input.detail);
      const nowIso = new Date().toISOString();

      await db.batch([
        db
          .update(appointments)
          .set({
            status: "cancelled",
            cancelReason,
            version: sql`${appointments.version} + 1`,
            updatedAt: nowIso,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(appointments.id, id),
              eq(appointments.version, input.version),
              isNull(appointments.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "appointments",
          rowId: id,
          before: { status: from, version: row.version },
          after: {
            status: "cancelled",
            cancelReason,
            cancelReasonCode: input.reason,
            notifyPatient: input.notifyPatient,
            version: row.version + 1,
          },
        }),
      ]);

      const next = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          cancelReason: appointments.cancelReason,
          version: appointments.version,
        })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!next || next.version !== row.version + 1) {
        throw new ConflictError(
          "Someone else just changed this appointment. Reload and try again.",
        );
      }
      return {
        id: next.id,
        status: "cancelled" as const,
        cancelReason: next.cancelReason,
        version: next.version,
        notifyPatient: input.notifyPatient,
      };
    },
  };
}
