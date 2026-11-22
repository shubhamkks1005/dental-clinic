import { APPOINTMENT_PRIORITIES, APPOINTMENT_SOURCES, APPOINTMENT_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 2.3.1 appointments. Overlap uses date_local + start_min/end_min (IST minutes from midnight)
// so SQL never needs time-zone math. Soft delete via deleted_at; status machine in 2.3.6.
export const appointments = sqliteTable(
  "appointments",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    chairId: text("chair_id").notNull(),
    // Copied at booking so later visit-type edits do not rewrite history (2.3.2).
    visitTypeId: text("visit_type_id").notNull(),
    visitTypeLabel: text("visit_type_label").notNull(),
    startAt: text("start_at").notNull(),
    dateLocal: text("date_local").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    status: text("status", { enum: APPOINTMENT_STATUSES }).notNull(),
    source: text("source", { enum: APPOINTMENT_SOURCES }).notNull(),
    priority: text("priority", { enum: APPOINTMENT_PRIORITIES }).notNull().default("normal"),
    overbook: integer("overbook", { mode: "boolean" }).notNull().default(false),
    complaint: text("complaint"),
    cancelReason: text("cancel_reason"),
    rescheduledFrom: text("rescheduled_from"),
    arrivedAt: text("arrived_at"),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
  },
  (t) => [
    index("appointments_chair_day_start_idx").on(t.chairId, t.dateLocal, t.startMin),
    index("appointments_patient_day_idx").on(t.patientId, t.dateLocal),
    index("appointments_day_status_idx").on(t.dateLocal, t.status),
    check("appointments_status_check", oneOf(t.status.name, APPOINTMENT_STATUSES)),
    check("appointments_source_check", oneOf(t.source.name, APPOINTMENT_SOURCES)),
    check("appointments_priority_check", oneOf(t.priority.name, APPOINTMENT_PRIORITIES)),
    check("appointments_overbook_bool", sql.raw(`"overbook" IN (0, 1)`)),
    check(
      "appointments_mins_range",
      sql.raw(
        `("start_min" >= 0 AND "start_min" < 1440 AND "end_min" > "start_min" AND "end_min" <= 1440)`,
      ),
    ),
    check(
      "appointments_date_local_format",
      sql.raw(`"date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);
