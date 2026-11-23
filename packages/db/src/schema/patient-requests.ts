import { index, check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

export const PATIENT_REQUEST_TYPES = ["correct", "copy", "withdraw_consent", "other"] as const;
export const PATIENT_REQUEST_STATUSES = ["open", "done", "rejected"] as const;

export const patientRequests = sqliteTable(
  "patient_requests",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    type: text("type").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull(),
    dueOn: text("due_on").notNull(),
    closedNote: text("closed_note"),
    closedAt: text("closed_at"),
    closedBy: text("closed_by"),
  },
  (t) => [
    check("patient_requests_type_check", oneOf("type", PATIENT_REQUEST_TYPES)),
    check("patient_requests_status_check", oneOf("status", PATIENT_REQUEST_STATUSES)),
    index("patient_requests_status_due_idx").on(t.status, t.dueOn),
    index("patient_requests_patient_idx").on(t.patientId, t.createdAt),
  ],
);
