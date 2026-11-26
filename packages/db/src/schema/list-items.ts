import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// 1.5.4 items of the doctor's editable lists (visit types, referral sources, ...). Which lists
// exist and their extra fields: packages/shared/src/lists.ts (no CHECK on list_key, so a new list
// needs no migration). Items are hidden (active = 0), never deleted.
export const listItems = sqliteTable(
  "list_items",
  {
    ...standardColumns(),
    listKey: text("list_key").notNull(),
    label: text("label").notNull(),
    dataJson: text("data_json").notNull().default("{}"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [
    index("list_items_key_label_idx").on(t.listKey, t.label),
    index("list_items_key_order_idx").on(t.listKey, t.sortOrder),
    check("list_items_data_is_json", sql.raw(`json_valid("data_json")`)),
    check("list_items_active_bool", sql.raw(`"active" IN (0, 1)`)),
  ],
);
