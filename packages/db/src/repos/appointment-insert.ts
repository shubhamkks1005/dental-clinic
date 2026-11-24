import { APPOINTMENT_BUSY_STATUSES, type BookAppointmentInput } from "@clinic/shared";
import { getTableColumns, is, sql, SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "../client";
import { appointments } from "../schema";

export type AppointmentInsertValues = {
  id: string;
  patientId: string;
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

// INSERT ... SELECT WHERE NOT EXISTS (overlap). Pair with auditInsertIfChanged (2.3.4).
export function insertAppointmentIfFree(db: Db, values: AppointmentInsertValues) {
  const busy = APPOINTMENT_BUSY_STATUSES.map((s) => sql`${s}`);
  const free = sql`
    NOT EXISTS (
      SELECT 1 FROM appointments
      WHERE chair_id = ${values.chairId}
        AND date_local = ${values.dateLocal}
        AND deleted_at IS NULL
        AND status IN (${sql.join(busy, sql`, `)})
        AND start_min < ${values.endMin}
        AND end_min > ${values.startMin}
    )
  `;
  return insertSelectWhere(db, appointments, appointmentInsertCells(values), free);
}

// 2.3.7 emergency overbook: insert even when the chair slot overlaps a busy row.
export function insertAppointmentAllowingOverlap(db: Db, values: AppointmentInsertValues) {
  return insertSelectWhere(db, appointments, appointmentInsertCells(values), sql`1`);
}
