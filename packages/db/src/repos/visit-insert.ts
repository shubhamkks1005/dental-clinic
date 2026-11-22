import { getTableColumns, is, sql, SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "../client";
import { visits } from "../schema";

export type VisitInsertValues = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  visitDateLocal: string;
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

// INSERT … WHERE no live visit for this appointment (3.2.1). Null appointment always inserts.
export function insertVisitIfAppointmentFree(db: Db, values: VisitInsertValues) {
  const free =
    values.appointmentId === null
      ? sql`1`
      : sql`
        NOT EXISTS (
          SELECT 1 FROM visits
          WHERE appointment_id = ${values.appointmentId}
            AND deleted_at IS NULL
        )
      `;
  return insertSelectWhere(
    db,
    visits,
    {
      id: values.id,
      createdBy: values.createdBy,
      updatedBy: values.updatedBy,
      patientId: values.patientId,
      appointmentId: values.appointmentId,
      doctorId: values.doctorId,
      visitDateLocal: values.visitDateLocal,
      status: "draft",
      chiefComplaint: null,
      historyNote: null,
      examNote: null,
      gumCondition: null,
      bpSystolic: null,
      bpDiastolic: null,
      pulse: null,
      advice: null,
      nextVisitNote: null,
      finalisedAt: null,
      finalisedBy: null,
      snapshotJson: null,
      snapshotHash: null,
    },
    free,
  );
}
