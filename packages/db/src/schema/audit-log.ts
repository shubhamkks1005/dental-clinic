import { AUDIT_ACTIONS } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Append-only. Who = created_by, when = created_at. Written in the same db.batch as the change (1.2.5).
export const auditLog = sqliteTable(
  "audit_log",
  {
    ...standardColumns(),
    action: text("action", { enum: AUDIT_ACTIONS }).notNull(),
    tableName: text("table_name").notNull(),
    rowId: text("row_id").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    requestId: text("request_id"),
  },
  (t) => [
    check("audit_log_action_check", oneOf(t.action.name, AUDIT_ACTIONS)),
    check(
      "audit_log_json",
      sql.raw(
        `("before_json" IS NULL OR json_valid("before_json")) AND ("after_json" IS NULL OR json_valid("after_json"))`,
      ),
    ),
  ],
);
