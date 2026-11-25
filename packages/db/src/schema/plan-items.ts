import { PLAN_ITEM_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 3.2.5 treatment plan items. Estimate increases require a reason (plan_item_versions).
export const planItems = sqliteTable(
  "plan_items",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    toothFdi: integer("tooth_fdi"),
    listItemId: text("list_item_id"),
    procedureLabel: text("procedure_label").notNull(),
    estimatePaise: integer("estimate_paise").notNull(),
    phase: integer("phase").notNull().default(1),
    status: text("status", { enum: PLAN_ITEM_STATUSES }).notNull().default("planned"),
    sittings: integer("sittings").notNull().default(1),
    // Sittings already done (migration 0061); "left" = sittings - sittingsDone.
    sittingsDone: integer("sittings_done").notNull().default(0),
    toldOn: text("told_on"),
    createdVisitId: text("created_visit_id"),
    completedVisitId: text("completed_visit_id"),
  },
  (t) => [
    index("plan_items_patient_status_idx").on(t.patientId, t.status),
    check("plan_items_status_check", oneOf(t.status.name, PLAN_ITEM_STATUSES)),
    check("plan_items_estimate_nonneg", sql.raw(`"estimate_paise" >= 0`)),
    check("plan_items_phase_positive", sql.raw(`"phase" >= 1`)),
    check("plan_items_sittings_positive", sql.raw(`"sittings" >= 1`)),
    check("plan_items_sittings_done_nonneg", sql.raw(`"sittings_done" >= 0`)),
    check(
      "plan_items_tooth_fdi",
      sql.raw(
        `("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`,
      ),
    ),
    check(
      "plan_items_told_on_format",
      sql.raw(`("told_on" IS NULL OR "told_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`),
    ),
  ],
);

export const planItemVersions = sqliteTable(
  "plan_item_versions",
  {
    ...standardColumns(),
    planItemId: text("plan_item_id").notNull(),
    estimatePaise: integer("estimate_paise").notNull(),
    reason: text("reason").notNull(),
    changedAt: text("changed_at").notNull(),
    changedBy: text("changed_by").notNull(),
  },
  (t) => [
    index("plan_item_versions_item_idx").on(t.planItemId, t.changedAt),
    check("plan_item_versions_estimate_nonneg", sql.raw(`"estimate_paise" >= 0`)),
  ],
);
