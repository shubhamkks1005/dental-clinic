import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

export const VISIT_ADDENDUM_KINDS = ["note", "entered_in_error"] as const;

// 3.2.6 / 3.5.7: corrections after finalise. Never edit the finalised visit row.
export const visitAddenda = sqliteTable(
  "visit_addenda",
  {
    ...standardColumns(),
    visitId: text("visit_id").notNull(),
    kind: text("kind", { enum: VISIT_ADDENDUM_KINDS }).notNull().default("note"),
    body: text("body").notNull(),
    reason: text("reason").notNull(),
    recordedAt: text("recorded_at").notNull(),
    recordedBy: text("recorded_by").notNull(),
  },
  (t) => [
    index("visit_addenda_visit_idx").on(t.visitId, t.recordedAt),
    check("visit_addenda_kind_check", oneOf(t.kind.name, VISIT_ADDENDUM_KINDS)),
    check("visit_addenda_body_not_empty", sql.raw(`length(trim("body")) > 0`)),
    check("visit_addenda_reason_not_empty", sql.raw(`length(trim("reason")) > 0`)),
  ],
);
