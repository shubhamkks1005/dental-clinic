import { TOOTH_SURFACES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 3.2.2 append-only tooth chart events. Current chart = latest row per tooth+surface.
// Soft-delete only (deleted_at); never UPDATE condition fields after insert.
export const toothEvents = sqliteTable(
  "tooth_events",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    toothFdi: integer("tooth_fdi").notNull(),
    surface: text("surface", { enum: TOOTH_SURFACES }).notNull(),
    conditionCode: text("condition_code").notNull(),
    visitId: text("visit_id"),
    notedAt: text("noted_at").notNull(),
    notedBy: text("noted_by").notNull(),
  },
  (t) => [
    index("tooth_events_patient_tooth_idx").on(t.patientId, t.toothFdi, t.notedAt),
    index("tooth_events_patient_noted_idx").on(t.patientId, t.notedAt),
    index("tooth_events_visit_idx").on(t.visitId),
    check("tooth_events_surface_check", oneOf(t.surface.name, TOOTH_SURFACES)),
    check(
      "tooth_events_fdi_range",
      sql.raw(`("tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`),
    ),
  ],
);
