import {
  chairForDoctor,
  clinicWorkingIntervals,
  findFreeSlots,
  istDate,
  istLocalToUtc,
  istMinutes,
  newUlid,
  slotSearchEarliest,
  visitTypeSnapshot,
  type Holiday,
  type Timings,
  type WalkInAppointmentInput,
} from "@clinic/shared";
import { and, eq, isNull, or } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";
import {
  insertAppointmentAllowingOverlap,
  insertAppointmentUnlessRepeat,
  type AppointmentInsertValues,
} from "./appointment-insert";
import { doctorsRepo, requireBookingDoctor } from "./doctors";
import { loadVisitType, requireBookablePatient } from "./visit-type-load";
import { newcomerQueueOrder } from "./queue-newcomer";
import { markFirstArrivedBatch } from "./patient-first-arrived";

export type WalkInAppointment = {
  id: string;
  patientId: string;
  visitTypeLabel: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
  status: "arrived";
  priority: "normal" | "emergency";
  overbook: boolean;
  arrivedAt: string;
  version: number;
};

export type WalkInOptions = {
  timings: Timings;
  holidays: Holiday[];
  now: Date;
};

/** That doctor's own chair today (old rows with no doctor count for everyone). */
async function loadBusyToday(db: Db, day: string, doctorId: string) {
  return db
    .select({
      dateLocal: appointments.dateLocal,
      startMin: appointments.startMin,
      endMin: appointments.endMin,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        isNull(appointments.deletedAt),
        eq(appointments.dateLocal, day),
        or(eq(appointments.doctorId, doctorId), isNull(appointments.doctorId)),
      ),
    )
    .all();
}

/** Walk-in without a chosen doctor: a doctor takes it themself; the desk gets the only doctor. */
async function walkInDoctorId(db: Db, ctx: Ctx, chosen: string | undefined): Promise<string> {
  if (chosen) return chosen;
  if (ctx.role === "doctor") return ctx.userId;
  const active = await doctorsRepo(db, ctx).listActive();
  if (active.length === 1) return active[0]!.id;
  throw new InvalidError("Choose a doctor.");
}

function emergencySlot(
  now: Date,
  durationMin: number,
  slotMinutes: number,
): { dateLocal: string; startMin: number; endMin: number } {
  const dateLocal = istDate(now);
  const raw = istMinutes(now);
  const startMin = Math.min(Math.floor(raw / slotMinutes) * slotMinutes, 1440 - durationMin);
  return { dateLocal, startMin, endMin: startMin + durationMin };
}

// 2.3.7: walk-in = soonest free slot today in the doctor's own chair, as arrived; emergency may
// overbook that chair.
export function appointmentsWalkInRepo(db: Db, ctx: Ctx) {
  return {
    async walkIn(input: WalkInAppointmentInput, opts: WalkInOptions): Promise<WalkInAppointment> {
      assertAllowed(ctx, "appointments.manage");
      const today = istDate(opts.now);
      const doctorId = await walkInDoctorId(db, ctx, input.doctorId);
      const doctor = await requireBookingDoctor(db, ctx, doctorId, today);
      await requireBookablePatient(db, input.patientId);
      const visit = await loadVisitType(db, input.visitTypeId);
      const snap = visitTypeSnapshot(visit, opts.timings.slotMinutes);
      const emergency = (input.priority ?? "normal") === "emergency";
      const busy = await loadBusyToday(db, today, doctor.id);
      const slots = findFreeSlots({
        timings: opts.timings,
        holidays: opts.holidays,
        durationMin: snap.durationMin,
        earliest: slotSearchEarliest(opts.now),
        busy,
        limit: 1,
        searchDays: 1,
      });

      let dateLocal: string;
      let startMin: number;
      let endMin: number;
      let overbook = false;

      if (slots[0]) {
        ({ dateLocal, startMin, endMin } = slots[0]);
      } else if (emergency) {
        ({ dateLocal, startMin, endMin } = emergencySlot(
          opts.now,
          snap.durationMin,
          opts.timings.slotMinutes,
        ));
        overbook = true;
      } else {
        throw new InvalidError(
          "No free slot left today for a walk-in. Try a later booking, or mark as emergency.",
        );
      }

      // Soft closed-day check for non-overbook; emergency still proceeds (overbook).
      if (
        !overbook &&
        clinicWorkingIntervals(dateLocal, opts.timings, opts.holidays).length === 0
      ) {
        throw new InvalidError("The clinic is closed today. Mark as emergency to override.");
      }

      const id = newUlid();
      const nowIso = opts.now.toISOString();
      const values: AppointmentInsertValues = {
        id,
        patientId: input.patientId,
        doctorId: doctor.id,
        chairId: chairForDoctor(doctor.id),
        visitTypeId: snap.visitTypeId,
        visitTypeLabel: snap.visitTypeLabel,
        startAt: istLocalToUtc(dateLocal, startMin).toISOString(),
        dateLocal,
        startMin,
        endMin,
        status: "arrived",
        source: "walk_in",
        priority: input.priority ?? "normal",
        overbook,
        complaint: input.complaint ?? null,
        arrivedAt: nowIso,
        queueOrder: newcomerQueueOrder(dateLocal, doctor.id),
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };

      await db.batch([
        overbook
          ? insertAppointmentAllowingOverlap(db, values)
          : insertAppointmentUnlessRepeat(db, values),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "appointments",
          rowId: id,
          after: {
            patientId: values.patientId,
            doctorId: values.doctorId,
            source: "walk_in",
            priority: values.priority,
            status: "arrived",
            overbook,
            dateLocal,
            startMin,
            endMin,
            arrivedAt: nowIso,
            ...(emergency ? { overrideReason: "Emergency walk-in" } : {}),
          },
        }),
        ...markFirstArrivedBatch(db, ctx, input.patientId, dateLocal, nowIso),
      ]);

      const row = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          visitTypeLabel: appointments.visitTypeLabel,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          priority: appointments.priority,
          overbook: appointments.overbook,
          arrivedAt: appointments.arrivedAt,
          version: appointments.version,
        })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!row || row.status !== "arrived" || !row.arrivedAt) {
        throw new ConflictError(
          overbook
            ? "Could not add this emergency walk-in. Try again."
            : "This patient is already booked at that time.",
        );
      }
      return {
        id: row.id,
        patientId: row.patientId,
        visitTypeLabel: row.visitTypeLabel,
        dateLocal: row.dateLocal,
        startMin: row.startMin,
        endMin: row.endMin,
        startAt: row.startAt,
        status: "arrived",
        priority: row.priority as "normal" | "emergency",
        overbook: row.overbook,
        arrivedAt: row.arrivedAt,
        version: row.version,
      };
    },
  };
}
