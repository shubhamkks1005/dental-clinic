import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// One row per key; `version` counts edits and every change is audited (1.5.1).
export const settings = sqliteTable(
  "settings",
  {
    ...standardColumns(),
    key: text("key").notNull().unique(),
    valueJson: text("value_json").notNull(),
  },
  () => [check("settings_value_is_json", sql.raw(`json_valid("value_json")`))],
);
