import {
  isAllowedStatusTransition,
  statusTransitionBlockReason,
  type AppointmentStatus,
  type ChangeAppointmentStatusInput,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";

export type AppointmentStatusRow = {
  id: string;
  status: AppointmentStatus;
  arrivedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  version: number;
};

function stampsFor(
  to: AppointmentStatus,
  nowIso: string,
): Partial<{ arrivedAt: string; startedAt: string; endedAt: string }> {
  if (to === "arrived") return { arrivedAt: nowIso };
  if (to === "in_chair") return { startedAt: nowIso };
  if (to === "completed") return { endedAt: nowIso };
  return {};
}

// 2.3.6: one place for the status wheel; illegal moves get ConflictError / InvalidError.
export function appointmentsStatusRepo(db: Db, ctx: Ctx) {
  return {
    async changeStatus(
      id: string,
      input: ChangeAppointmentStatusInput,
      now: Date = new Date(),
    ): Promise<AppointmentStatusRow> {
      assertAllowed(ctx, "appointments.manage");
      const row = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That appointment");

      const from = row.status as AppointmentStatus;
      const to = input.status;
      if (!isAllowedStatusTransition(from, to)) {
        throw new ConflictError("That status change is not allowed.");
      }
      const block = statusTransitionBlockReason(from, to, {
        startAt: new Date(row.startAt),
        statusChangedAt: new Date(row.updatedAt),
        now,
      });
      if (block) throw new InvalidError(block);

      const nowIso = now.toISOString();
      const stamp = stampsFor(to, nowIso);
      const cancelReason =
        to === "cancelled" ? (input.cancelReason ?? row.cancelReason) : row.cancelReason;

      await db.batch([
        db
          .update(appointments)
          .set({
            status: to,
            version: sql`${appointments.version} + 1`,
            updatedBy: ctx.userId,
            updatedAt: nowIso,
            cancelReason,
            ...stamp,
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
            status: to,
            version: row.version + 1,
            ...(stamp.arrivedAt ? { arrivedAt: stamp.arrivedAt } : {}),
            ...(stamp.startedAt ? { startedAt: stamp.startedAt } : {}),
            ...(stamp.endedAt ? { endedAt: stamp.endedAt } : {}),
            ...(to === "cancelled" && input.cancelReason
              ? { cancelReason: input.cancelReason }
              : {}),
          },
        }),
      ]);

      const next = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          arrivedAt: appointments.arrivedAt,
          startedAt: appointments.startedAt,
          endedAt: appointments.endedAt,
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
        status: next.status as AppointmentStatus,
        arrivedAt: next.arrivedAt,
        startedAt: next.startedAt,
        endedAt: next.endedAt,
        version: next.version,
      };
    },
  };
}
