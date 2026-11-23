import { sqliteTable, text, index, check } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

export const ERROR_LOG_SOURCES = ["server", "browser"] as const;

export const errorLog = sqliteTable(
  "error_log",
  {
    ...standardColumns(),
    source: text("source").notNull(),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    path: text("path"),
    requestId: text("request_id"),
    appVersion: text("app_version"),
    role: text("role"),
  },
  (t) => [
    check("error_log_source_check", oneOf("source", ERROR_LOG_SOURCES)),
    index("error_log_created_idx").on(t.createdAt),
  ],
);
