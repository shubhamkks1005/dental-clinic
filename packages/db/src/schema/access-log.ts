import { ACCESS_ACTIONS } from "@clinic/shared";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Append-only record of logins and of who viewed or exported patient data. Who = created_by.
export const accessLog = sqliteTable(
  "access_log",
  {
    ...standardColumns(),
    action: text("action", { enum: ACCESS_ACTIONS }).notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    requestId: text("request_id"),
  },
  (t) => [check("access_log_action_check", oneOf(t.action.name, ACCESS_ACTIONS))],
);
