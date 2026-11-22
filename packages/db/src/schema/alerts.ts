import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// 3.2.4 patient alerts derived from medical history. Soft-deactivate; never hard-delete.
// restricted=1: receptionist sees flag only (clinical.alert_flag), not the label text via API.
export const alerts = sqliteTable(
  "alerts",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    restricted: integer("restricted", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sourceHistoryId: text("source_history_id"),
  },
  (t) => [
    uniqueIndex("alerts_patient_code_live_uidx")
      .on(t.patientId, t.code)
      .where(sql`${t.deletedAt} IS NULL AND ${t.active} = 1`),
    index("alerts_patient_active_idx").on(t.patientId, t.active),
    check("alerts_restricted_bool", sql.raw(`"restricted" IN (0, 1)`)),
    check("alerts_active_bool", sql.raw(`"active" IN (0, 1)`)),
  ],
);
