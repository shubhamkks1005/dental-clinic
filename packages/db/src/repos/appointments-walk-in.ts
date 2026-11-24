import {
  clinicWorkingIntervals,
  DEFAULT_CHAIR_ID,
  findFreeSlots,
  istDate,
  istLocalToUtc,
  istMinutes,
  newUlid,
  slotSearchEarliest,
  visitTypeSnapshot,
  type Holiday,
  type ListItem,
  type Timings,
  type WalkInAppointmentInput,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, listItems, patients } from "../schema";
import {
  insertAppointmentAllowingOverlap,
  insertAppointmentIfFree,
  type AppointmentInsertValues,
} from "./appointment-insert";
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

async function requirePatient(db: Db, id: string) {
  const row = await db
    .select({ id: patients.id, status: patients.status })
    .from(patients)
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .get();
  if (!row) throw new NotFoundError("That patient");
  if (row.status !== "active") {
    throw new InvalidError("This patient is archived. Restore them before booking.");
  }
}

async function loadBusyToday(db: Db, day: string) {
  return db
    .select({
      dateLocal: appointments.dateLocal,
      startMin: appointments.startMin,
      endMin: appointments.endMin,
      status: appointments.status,
    })
    .from(appointments)
    .where(and(isNull(appointments.deletedAt), eq(appointments.dateLocal, day)))
    .all();
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

// 2.3.7: walk-in = soonest free slot today as arrived; emergency may overbook the chair.
export function appointmentsWalkInRepo(db: Db, ctx: Ctx) {
  return {
    async walkIn(input: WalkInAppointmentInput, opts: WalkInOptions): Promise<WalkInAppointment> {
      assertAllowed(ctx, "appointments.manage");
      await requirePatient(db, input.patientId);
      const visit = await loadVisitType(db, input.visitTypeId);
      const snap = visitTypeSnapshot(visit, opts.timings.slotMinutes);
      const emergency = (input.priority ?? "normal") === "emergency";
      const today = istDate(opts.now);
      const busy = await loadBusyToday(db, today);
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
        chairId: DEFAULT_CHAIR_ID,
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
        queueOrder: newcomerQueueOrder(dateLocal),
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };

      await db.batch([
        overbook
          ? insertAppointmentAllowingOverlap(db, values)
          : insertAppointmentIfFree(db, values),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "appointments",
          rowId: id,
          after: {
            patientId: values.patientId,
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
            : "That time was just taken. Try again or mark as emergency.",
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
