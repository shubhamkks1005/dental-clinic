import { ACCESS_ACTIONS } from "@clinic/shared";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Append-only record of sign-ins, sign-in failures, staff changes and who viewed or exported
// patient data. Who = created_by ('anonymous' for failed sign-ins). detail: reason, masked email.
export const accessLog = sqliteTable(
  "access_log",
  {
    ...standardColumns(),
    action: text("action", { enum: ACCESS_ACTIONS }).notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    requestId: text("request_id"),
    detail: text("detail"),
  },
  (t) => [check("access_log_action_check", oneOf(t.action.name, ACCESS_ACTIONS))],
);
