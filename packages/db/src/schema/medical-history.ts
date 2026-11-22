import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// 3.2.4 versioned medical history: each save is a new version row; never overwrite old JSON.
export const medicalHistory = sqliteTable(
  "medical_history",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    versionNo: integer("version_no").notNull(),
    answersJson: text("answers_json").notNull(),
    recordedAt: text("recorded_at").notNull(),
    recordedBy: text("recorded_by").notNull(),
  },
  (t) => [
    uniqueIndex("medical_history_patient_version_uidx").on(t.patientId, t.versionNo),
    index("medical_history_patient_recorded_idx").on(t.patientId, t.recordedAt),
    check("medical_history_answers_json", sql.raw(`json_valid("answers_json")`)),
    check("medical_history_version_positive", sql.raw(`"version_no" >= 1`)),
  ],
);
