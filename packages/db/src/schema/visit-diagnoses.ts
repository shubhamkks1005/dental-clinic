import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// 3.2.3 diagnoses on a visit: list item snapshot and/or free text; optional FDI tooth.
export const visitDiagnoses = sqliteTable(
  "visit_diagnoses",
  {
    ...standardColumns(),
    visitId: text("visit_id").notNull(),
    listItemId: text("list_item_id"),
    label: text("label").notNull(),
    toothFdi: integer("tooth_fdi"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("visit_diagnoses_visit_idx").on(t.visitId, t.sortOrder),
    check(
      "visit_diagnoses_tooth_fdi",
      sql.raw(
        `("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`,
      ),
    ),
  ],
);
