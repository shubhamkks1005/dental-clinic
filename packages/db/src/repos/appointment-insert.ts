import { APPOINTMENT_BUSY_STATUSES, type BookAppointmentInput } from "@clinic/shared";
import { getTableColumns, is, sql, SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "../client";
import { appointments } from "../schema";

export type AppointmentInsertValues = {
  id: string;
  patientId: string;
  /** The booking's doctor; their own chair is chairForDoctor(doctorId). */
  doctorId: string;
  chairId: string;
  visitTypeId: string;
  visitTypeLabel: string;
  startAt: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  status: "scheduled" | "arrived";
  source: BookAppointmentInput["source"];
  priority: BookAppointmentInput["priority"];
  overbook: boolean;
  complaint: string | null;
  arrivedAt?: string | null;
  rescheduledFrom?: string | null;
  /** A walk-in goes to the back of a day the doctor has reordered (queue-newcomer.ts). */
  queueOrder?: SQL | null;
  createdBy: string;
  updatedBy: string;
};

function insertSelectWhere<T extends SQLiteTable>(
  db: Db,
  table: T,
  values: Record<string, unknown>,
  where: SQL,
) {
  const cells = Object.entries(getTableColumns(table)).map(([key, column]) => {
    if (key in values) return sql`${values[key]}`;
    if (is(column.default, SQL)) return column.default;
    return column.default === undefined ? sql`NULL` : sql`${column.default}`;
  });
  return db.insert(table).select(sql`SELECT ${sql.join(cells, sql`, `)} WHERE ${where}`);
}

function appointmentInsertCells(values: AppointmentInsertValues) {
  return {
    id: values.id,
    createdBy: values.createdBy,
    updatedBy: values.updatedBy,
    patientId: values.patientId,
    doctorId: values.doctorId,
    chairId: values.chairId,
    visitTypeId: values.visitTypeId,
    visitTypeLabel: values.visitTypeLabel,
    startAt: values.startAt,
    dateLocal: values.dateLocal,
    startMin: values.startMin,
    endMin: values.endMin,
    status: values.status,
    source: values.source,
    priority: values.priority,
    overbook: values.overbook ? 1 : 0,
    complaint: values.complaint,
    cancelReason: null,
    rescheduledFrom: values.rescheduledFrom ?? null,
    arrivedAt: values.arrivedAt ?? null,
    startedAt: null,
    endedAt: null,
    queueOrder: values.queueOrder ?? null,
  };
}

/**
 * Clashes are allowed (owner 2026-11-26), so overlap no longer refuses a booking. Only an exact
 * repeat is refused: the same patient, doctor, day and start while that booking is still busy.
 * This stops a double click or two desks from making two rows. A move never counts the row it
 * moves from. Pair with auditInsertIfChanged.
 */
export function insertAppointmentUnlessRepeat(db: Db, values: AppointmentInsertValues) {
  const busy = APPOINTMENT_BUSY_STATUSES.map((s) => sql`${s}`);
  const notRepeat = sql`
    NOT EXISTS (
      SELECT 1 FROM appointments
      WHERE patient_id = ${values.patientId}
        AND doctor_id = ${values.doctorId}
        AND date_local = ${values.dateLocal}
        AND start_min = ${values.startMin}
        AND deleted_at IS NULL
        AND status IN (${sql.join(busy, sql`, `)})
        AND id <> ${values.rescheduledFrom ?? ""}
    )
  `;
  return insertSelectWhere(db, appointments, appointmentInsertCells(values), notRepeat);
}

export const REPEAT_BOOKING_MESSAGE = "This patient is already booked at that time.";

// 2.3.7 emergency overbook: insert even when the chair slot overlaps a busy row.
export function insertAppointmentAllowingOverlap(db: Db, values: AppointmentInsertValues) {
  return insertSelectWhere(db, appointments, appointmentInsertCells(values), sql`1`);
}
