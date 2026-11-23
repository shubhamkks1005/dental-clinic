import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

/** 9.1.10: last known status of backup / quota / other ops checks (no PHI). */
export const OPS_STATUS_KEYS = ["backup_d1", "backup_files", "backup_pc", "quota"] as const;
export type OpsStatusKey = (typeof OPS_STATUS_KEYS)[number];

export const OPS_STATUS_VALUES = ["ok", "fail", "unknown"] as const;
export type OpsStatusValue = (typeof OPS_STATUS_VALUES)[number];

export const opsStatus = sqliteTable(
  "ops_status",
  {
    ...standardColumns(),
    key: text("key").notNull().unique(),
    status: text("status").notNull(),
    detailJson: text("detail_json").notNull().default("{}"),
    checkedAt: text("checked_at").notNull(),
  },
  () => [
    check("ops_status_key_check", oneOf("key", OPS_STATUS_KEYS)),
    check("ops_status_status_check", oneOf("status", OPS_STATUS_VALUES)),
    check("ops_status_detail_is_json", sql.raw(`json_valid("detail_json")`)),
  ],
);
