import type { AppointmentPriority, AppointmentStatus } from "@clinic/shared";
import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, patients, users } from "../schema";

export type PatientAppointmentRow = {
  id: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
  status: AppointmentStatus;
  visitTypeLabel: string;
  priority: string;
  source: string;
  rescheduledFrom: string | null;
  cancelReason: string | null;
  version: number;
  visitTypeId: string;
  updatedAt: string;
};

/** Walk rescheduled_from links oldest → newest (2.3.8 history chain). */
export async function loadRescheduleChain(db: Db, tipId: string): Promise<PatientAppointmentRow[]> {
  const byId = new Map<string, PatientAppointmentRow>();
  let id: string | null = tipId;
  for (let i = 0; i < 20 && id; i++) {
    const row = await db
      .select({
        id: appointments.id,
        dateLocal: appointments.dateLocal,
        startMin: appointments.startMin,
        endMin: appointments.endMin,
        startAt: appointments.startAt,
        status: appointments.status,
        visitTypeLabel: appointments.visitTypeLabel,
        priority: appointments.priority,
        source: appointments.source,
        rescheduledFrom: appointments.rescheduledFrom,
        cancelReason: appointments.cancelReason,
        version: appointments.version,
        visitTypeId: appointments.visitTypeId,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
      .get();
    if (!row) break;
    const mapped: PatientAppointmentRow = {
      ...row,
      status: row.status as AppointmentStatus,
    };
    byId.set(mapped.id, mapped);
    id = mapped.rescheduledFrom;
  }
  const tip = byId.get(tipId);
  if (!tip) return [];
  const ordered: PatientAppointmentRow[] = [];
  let cur: PatientAppointmentRow | undefined = tip;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    ordered.push(cur);
    cur = cur.rescheduledFrom ? byId.get(cur.rescheduledFrom) : undefined;
  }
  return ordered.reverse();
}

export type DayAppointmentRow = {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientMobile: string | null;
  /** The booking's doctor (0066); null only on rows from before any doctor existed. */
  doctorId: string | null;
  chairId: string;
  visitTypeId: string;
  visitTypeLabel: string;
  startAt: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  status: AppointmentStatus;
  source: string;
  priority: AppointmentPriority;
  overbook: boolean;
  complaint: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
  version: number;
  // Part T: the doctor's saved order and its flags.
  queueOrder: number | null;
  steppedOutAt: string | null;
  skipCount: number;
  lateAt: string | null;
  queueChangedAt: string | null;
  queueChangedBy: string | null;
};

const DAY_COLUMNS = {
  id: appointments.id,
  patientId: appointments.patientId,
  patientCode: patients.code,
  patientName: patients.fullName,
  patientMobile: patients.mobile,
  doctorId: appointments.doctorId,
  chairId: appointments.chairId,
  visitTypeId: appointments.visitTypeId,
  visitTypeLabel: appointments.visitTypeLabel,
  startAt: appointments.startAt,
  dateLocal: appointments.dateLocal,
  startMin: appointments.startMin,
  endMin: appointments.endMin,
  status: appointments.status,
  source: appointments.source,
  priority: appointments.priority,
  overbook: appointments.overbook,
  complaint: appointments.complaint,
  arrivedAt: appointments.arrivedAt,
  startedAt: appointments.startedAt,
  endedAt: appointments.endedAt,
  updatedAt: appointments.updatedAt,
  version: appointments.version,
  queueOrder: appointments.queueOrder,
  steppedOutAt: appointments.steppedOutAt,
  skipCount: appointments.skipCount,
  lateAt: appointments.lateAt,
  queueChangedAt: appointments.queueChangedAt,
  queueChangedBy: appointments.queueChangedBy,
};

type RawDayRow = Omit<DayAppointmentRow, "status" | "priority"> & {
  status: string;
  priority: string;
};

function typed(rows: RawDayRow[]): DayAppointmentRow[] {
  return rows.map((r) => ({
    ...r,
    status: r.status as AppointmentStatus,
    priority: r.priority as AppointmentPriority,
  }));
}

/**
 * A doctor sees only their own bookings (owner 2026-11-26); the desk sees every doctor's.
 * Rows with no doctor (made before any doctor existed) are shown to everyone.
 */
export function ownBookingsOnly(ctx: Ctx) {
  return ctx.role === "doctor"
    ? or(eq(appointments.doctorId, ctx.userId), isNull(appointments.doctorId))
    : undefined;
}

export function appointmentsListRepo(db: Db, ctx: Ctx) {
  return {
    async listForDay(dateLocal: string): Promise<DayAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select(DAY_COLUMNS)
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            eq(appointments.dateLocal, dateLocal),
            isNull(appointments.deletedAt),
            ownBookingsOnly(ctx),
          ),
        )
        .orderBy(asc(appointments.startMin), asc(appointments.createdAt))
        .all();
      return typed(rows);
    },

    /** The name in "Order updated by ..." (one small read, only when a row has a queue change). */
    async queueChangerName(userId: string): Promise<string | null> {
      assertAllowed(ctx, "appointments.manage");
      const row = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .get();
      return row?.name ?? null;
    },

    /** S3.2.2: every day from..to (both included) in one query; date_local range uses the day index. */
    async listForRange(from: string, to: string): Promise<DayAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select(DAY_COLUMNS)
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.dateLocal, from),
            lte(appointments.dateLocal, to),
            isNull(appointments.deletedAt),
            ownBookingsOnly(ctx),
          ),
        )
        .orderBy(
          asc(appointments.dateLocal),
          asc(appointments.startMin),
          asc(appointments.createdAt),
        )
        .all();
      return typed(rows);
    },

    async listForPatient(patientId: string): Promise<PatientAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const rows = await db
        .select({
          id: appointments.id,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          visitTypeLabel: appointments.visitTypeLabel,
          priority: appointments.priority,
          source: appointments.source,
          rescheduledFrom: appointments.rescheduledFrom,
          cancelReason: appointments.cancelReason,
          version: appointments.version,
          visitTypeId: appointments.visitTypeId,
          updatedAt: appointments.updatedAt,
        })
        .from(appointments)
        .where(and(eq(appointments.patientId, patientId), isNull(appointments.deletedAt)))
        .orderBy(desc(appointments.dateLocal), desc(appointments.startMin))
        .all();
      return rows.map((r) => ({ ...r, status: r.status as AppointmentStatus }));
    },

    async rescheduleChain(id: string): Promise<PatientAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const chain = await loadRescheduleChain(db, id);
      if (chain.length === 0) throw new NotFoundError("That appointment");
      return chain;
    },
  };
}
