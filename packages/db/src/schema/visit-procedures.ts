import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// 3.2.3 procedures done (or noted) on a visit. Surfaces stored as JSON array of m/d/o/b/l.
export const visitProcedures = sqliteTable(
  "visit_procedures",
  {
    ...standardColumns(),
    visitId: text("visit_id").notNull(),
    listItemId: text("list_item_id"),
    label: text("label").notNull(),
    toothFdi: integer("tooth_fdi"),
    surfacesJson: text("surfaces_json").notNull().default("[]"),
    note: text("note"),
    defaultPaise: integer("default_paise"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("visit_procedures_visit_idx").on(t.visitId, t.sortOrder),
    check("visit_procedures_surfaces_json", sql.raw(`json_valid("surfaces_json")`)),
    check(
      "visit_procedures_tooth_fdi",
      sql.raw(
        `("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`,
      ),
    ),
    check(
      "visit_procedures_paise_nonneg",
      sql.raw(`("default_paise" IS NULL OR "default_paise" >= 0)`),
    ),
  ],
);
