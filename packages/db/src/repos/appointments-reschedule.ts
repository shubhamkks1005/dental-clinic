import {
  bookingRuleViolations,
  DEFAULT_CHAIR_ID,
  isAllowedStatusTransition,
  istLocalToUtc,
  newUlid,
  visitTypeSnapshot,
  type AppointmentStatus,
  type Holiday,
  type ListItem,
  type RescheduleAppointmentInput,
  type Timings,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, listItems } from "../schema";
import { insertAppointmentIfFree, type AppointmentInsertValues } from "./appointment-insert";

export type RescheduleOptions = {
  timings: Timings;
  holidays: Holiday[];
  bookAheadDays: number;
  now: Date;
};

async function loadVisitType(db: Db, id: string): Promise<ListItem> {
  const row = await db
    .select()
    .from(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.listKey, "visit_types"), isNull(listItems.deletedAt)),
    )
    .get();
  if (!row || !row.active) throw new NotFoundError("That visit type");
  return {
    id: row.id,
    label: row.label,
    data: JSON.parse(row.dataJson) as ListItem["data"],
    active: row.active,
    sortOrder: row.sortOrder,
    version: row.version,
  };
}

// 2.3.8: new row linked via rescheduled_from; old status = rescheduled (never deleted).
export function appointmentsRescheduleRepo(db: Db, ctx: Ctx) {
  return {
    async reschedule(id: string, input: RescheduleAppointmentInput, opts: RescheduleOptions) {
      assertAllowed(ctx, "appointments.manage");
      const old = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
        .get();
      if (!old) throw new NotFoundError("That appointment");
      const from = old.status as AppointmentStatus;
      if (!isAllowedStatusTransition(from, "rescheduled")) {
        throw new ConflictError("That appointment cannot be rescheduled from its current status.");
      }

      const visitTypeId = input.visitTypeId ?? old.visitTypeId;
      const visit = await loadVisitType(db, visitTypeId);
      const snap = visitTypeSnapshot(visit, opts.timings.slotMinutes);
      const endMin = input.startMin + snap.durationMin;
      if (endMin > 1440) {
        throw new InvalidError("That visit does not fit on this day. Pick an earlier time.");
      }

      const violations = bookingRuleViolations({
        slot: { dateLocal: input.dateLocal, startMin: input.startMin, endMin },
        timings: opts.timings,
        holidays: opts.holidays,
        bookAheadDays: opts.bookAheadDays,
        now: opts.now,
      });
      const overrideReason = input.overrideReason ?? null;
      if (violations.length > 0 && !overrideReason) {
        throw new InvalidError(violations[0]!.message);
      }
      const overbook = violations.length > 0;

      const newId = newUlid();
      const nowIso = opts.now.toISOString();
      const values: AppointmentInsertValues = {
        id: newId,
        patientId: old.patientId,
        chairId: DEFAULT_CHAIR_ID,
        visitTypeId: snap.visitTypeId,
        visitTypeLabel: snap.visitTypeLabel,
        startAt: istLocalToUtc(input.dateLocal, input.startMin).toISOString(),
        dateLocal: input.dateLocal,
        startMin: input.startMin,
        endMin,
        status: "scheduled",
        source: old.source,
        priority: old.priority,
        overbook,
        complaint: old.complaint,
        rescheduledFrom: id,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };

      // Insert new (overlap-gated) then mark old rescheduled only if new row exists.
      await db.batch([
        insertAppointmentIfFree(db, values),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "appointments",
          rowId: newId,
          after: {
            patientId: values.patientId,
            dateLocal: values.dateLocal,
            startMin: values.startMin,
            endMin: values.endMin,
            rescheduledFrom: id,
            overbook,
            ...(overbook && overrideReason
              ? { overrideReason, overrodeRules: violations.map((v) => v.code) }
              : {}),
          },
        }),
      ]);

      const created = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          visitTypeLabel: appointments.visitTypeLabel,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          rescheduledFrom: appointments.rescheduledFrom,
          overbook: appointments.overbook,
          version: appointments.version,
        })
        .from(appointments)
        .where(eq(appointments.id, newId))
        .get();
      if (!created || created.status !== "scheduled") {
        throw new ConflictError("That time was just taken. Pick another slot from the fresh list.");
      }

      await db.batch([
        db
          .update(appointments)
          .set({
            status: "rescheduled",
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
          before: { status: from, version: old.version },
          after: { status: "rescheduled", version: old.version + 1, movedTo: newId },
        }),
      ]);

      const previous = await db
        .select({ id: appointments.id, status: appointments.status, version: appointments.version })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!previous || previous.status !== "rescheduled" || previous.version !== old.version + 1) {
        throw new ConflictError("Someone else just changed the old booking. Reload and try again.");
      }
      return { previous, appointment: created };
    },
  };
}
