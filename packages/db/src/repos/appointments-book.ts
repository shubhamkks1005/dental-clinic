import {
  bookingRuleViolations,
  chairForDoctor,
  istLocalToUtc,
  newUlid,
  visitTypeSnapshot,
  type BookAppointmentInput,
  type Holiday,
  type Timings,
} from "@clinic/shared";
import { eq } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";
import {
  insertAppointmentUnlessRepeat,
  REPEAT_BOOKING_MESSAGE,
  type AppointmentInsertValues,
} from "./appointment-insert";
import { requireBookingDoctor } from "./doctors";
import { loadVisitType, requireBookablePatient } from "./visit-type-load";

export type BookedAppointment = {
  id: string;
  patientId: string;
  doctorId: string;
  visitTypeLabel: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
  status: "scheduled";
  overbook: boolean;
  version: number;
};

export type BookAppointmentOptions = {
  timings: Timings;
  holidays: Holiday[];
  bookAheadDays: number;
  now: Date;
};

// 2.3.4 + 2.3.5 soft rules (past/closed/lunch/ahead/doctor leave) with override → overbook.
// Clashes are allowed (owner 2026-11-26); only an exact repeat booking is refused.
export function appointmentsBookRepo(db: Db, ctx: Ctx) {
  return {
    async book(
      input: BookAppointmentInput,
      opts: BookAppointmentOptions,
    ): Promise<BookedAppointment> {
      assertAllowed(ctx, "appointments.manage");
      const doctor = await requireBookingDoctor(db, ctx, input.doctorId, input.dateLocal);
      await requireBookablePatient(db, input.patientId);
      const visit = await loadVisitType(db, input.visitTypeId);
      const snap = visitTypeSnapshot(visit, opts.timings.slotMinutes);
      const durationMin = input.durationMin ?? snap.durationMin;
      const endMin = input.startMin + durationMin;
      if (endMin > 1440) {
        throw new InvalidError("That visit does not fit on this day. Pick an earlier time.");
      }

      const violations = bookingRuleViolations({
        slot: { dateLocal: input.dateLocal, startMin: input.startMin, endMin },
        timings: opts.timings,
        holidays: opts.holidays,
        bookAheadDays: opts.bookAheadDays,
        now: opts.now,
        leaveDays: doctor.onLeave ? [input.dateLocal] : [],
        doctorName: doctor.name,
      });
      const overrideReason = input.overrideReason ?? null;
      if (violations.length > 0 && !overrideReason) {
        throw new InvalidError(violations[0]!.message);
      }
      const overbook = violations.length > 0;

      const id = newUlid();
      const values: AppointmentInsertValues = {
        id,
        patientId: input.patientId,
        doctorId: doctor.id,
        chairId: chairForDoctor(doctor.id),
        visitTypeId: snap.visitTypeId,
        visitTypeLabel: snap.visitTypeLabel,
        startAt: istLocalToUtc(input.dateLocal, input.startMin).toISOString(),
        dateLocal: input.dateLocal,
        startMin: input.startMin,
        endMin,
        status: "scheduled",
        source: input.source,
        priority: input.priority ?? "normal",
        overbook,
        complaint: input.complaint ?? null,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };

      const after: Record<string, unknown> = {
        patientId: values.patientId,
        doctorId: values.doctorId,
        dateLocal: values.dateLocal,
        startMin: values.startMin,
        endMin: values.endMin,
        durationMin,
        visitTypeLabel: values.visitTypeLabel,
        source: values.source,
        overbook: values.overbook,
      };
      if (overbook && overrideReason) {
        after.overrideReason = overrideReason;
        after.overrodeRules = violations.map((v) => v.code);
      }

      await db.batch([
        insertAppointmentUnlessRepeat(db, values),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "appointments",
          rowId: id,
          after,
        }),
      ]);

      const row = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          doctorId: appointments.doctorId,
          visitTypeLabel: appointments.visitTypeLabel,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          overbook: appointments.overbook,
          version: appointments.version,
        })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!row || row.status !== "scheduled") {
        throw new ConflictError(REPEAT_BOOKING_MESSAGE);
      }
      return {
        id: row.id,
        patientId: row.patientId,
        doctorId: row.doctorId ?? doctor.id,
        visitTypeLabel: row.visitTypeLabel,
        dateLocal: row.dateLocal,
        startMin: row.startMin,
        endMin: row.endMin,
        startAt: row.startAt,
        status: "scheduled",
        overbook: row.overbook,
        version: row.version,
      };
    },
  };
}
