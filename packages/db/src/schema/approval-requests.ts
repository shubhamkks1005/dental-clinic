import { APPROVAL_STATUSES, APPROVAL_TYPES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

/**
 * T1.2: the desk asks the doctor (emergency insert, refund, ...). The doctor's answer is only
 * recorded; the desk does the work. No foreign keys (repo rule). Growth cap: one open request
 * per (type, appointment) and a retention rule (docs/RETENTION.md).
 */
export const approvalRequests = sqliteTable(
  "approval_requests",
  {
    ...standardColumns(),
    type: text("type", { enum: APPROVAL_TYPES }).notNull(),
    status: text("status", { enum: APPROVAL_STATUSES }).notNull().default("open"),
    appointmentId: text("appointment_id"),
    patientId: text("patient_id"),
    billId: text("bill_id"),
    note: text("note").notNull(),
    detail: text("detail"),
    urgent: integer("urgent", { mode: "boolean" }).notNull().default(false),
    answerNote: text("answer_note"),
    answeredAt: text("answered_at"),
    answeredBy: text("answered_by"),
  },
  (t) => [
    check("approval_requests_type_check", oneOf("type", APPROVAL_TYPES)),
    check("approval_requests_status_check", oneOf("status", APPROVAL_STATUSES)),
    check("approval_requests_note_len", sql.raw(`length("note") BETWEEN 1 AND 200`)),
    check(
      "approval_requests_answer_note_len",
      sql.raw(`"answer_note" IS NULL OR length("answer_note") <= 200`),
    ),
    check("approval_requests_urgent_bool", sql.raw(`"urgent" IN (0, 1)`)),
    index("approval_requests_status_idx").on(t.status, t.urgent, t.createdAt),
    uniqueIndex("approval_requests_one_open_uidx")
      .on(t.type, t.appointmentId)
      .where(
        sql.raw(`"status" = 'open' AND "appointment_id" IS NOT NULL AND "deleted_at" IS NULL`),
      ),
  ],
);
