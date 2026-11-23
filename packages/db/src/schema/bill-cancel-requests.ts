import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

export const BILL_CANCEL_REQUEST_STATUSES = ["open", "done", "dismissed"] as const;

/**
 * Q1.9: the receptionist cannot cancel an issued bill (D4), so she asks the doctor, with a reason.
 * The bill row itself is locked and is not touched. Growth cap: at most one OPEN request per bill
 * (partial unique index); closed rows are kept (money history, docs/RETENTION.md).
 */
export const billCancelRequests = sqliteTable(
  "bill_cancel_requests",
  {
    ...standardColumns(),
    billId: text("bill_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: BILL_CANCEL_REQUEST_STATUSES }).notNull(),
    closedAt: text("closed_at"),
    closedBy: text("closed_by"),
  },
  (t) => [
    check("bill_cancel_requests_status_check", oneOf("status", BILL_CANCEL_REQUEST_STATUSES)),
    check("bill_cancel_requests_reason_len", sql.raw(`length("reason") BETWEEN 1 AND 200`)),
    index("bill_cancel_requests_status_idx").on(t.status, t.createdAt),
    uniqueIndex("bill_cancel_requests_one_open_uidx")
      .on(t.billId)
      .where(sql.raw(`"status" = 'open' AND "deleted_at" IS NULL`)),
  ],
);
