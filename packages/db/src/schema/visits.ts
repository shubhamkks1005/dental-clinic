import { VISIT_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 3.2.1 clinical visits. One appointment → at most one non-deleted visit (partial unique).
// Finalise locks the row (3.2.6); draft edits use version checks.
export const visits = sqliteTable(
  "visits",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    appointmentId: text("appointment_id"),
    doctorId: text("doctor_id").notNull(),
    visitDateLocal: text("visit_date_local").notNull(),
    status: text("status", { enum: VISIT_STATUSES }).notNull().default("draft"),
    chiefComplaint: text("chief_complaint"),
    historyNote: text("history_note"),
    examNote: text("exam_note"),
    gumCondition: text("gum_condition"),
    bpSystolic: integer("bp_systolic"),
    bpDiastolic: integer("bp_diastolic"),
    pulse: integer("pulse"),
    advice: text("advice"),
    nextVisitNote: text("next_visit_note"),
    finalisedAt: text("finalised_at"),
    finalisedBy: text("finalised_by"),
    snapshotJson: text("snapshot_json"),
    snapshotHash: text("snapshot_hash"),
    // The doctor chose "No diagnosis / No procedure for this visit" (0 or 1). Adding a line clears it.
    noDiagnosis: integer("no_diagnosis", { mode: "boolean" }).notNull().default(false),
    noProcedure: integer("no_procedure", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("visits_patient_date_idx").on(t.patientId, t.visitDateLocal),
    index("visits_doctor_date_idx").on(t.doctorId, t.visitDateLocal),
    // At most one live visit per appointment (walk-in / profile visits leave this null).
    uniqueIndex("visits_appointment_live_uidx")
      .on(t.appointmentId)
      .where(sql`${t.appointmentId} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    check("visits_status_check", oneOf(t.status.name, VISIT_STATUSES)),
    check(
      "visits_date_local_format",
      sql.raw(`"visit_date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check("visits_no_diagnosis_flag", sql.raw(`"no_diagnosis" IN (0, 1)`)),
    check("visits_no_procedure_flag", sql.raw(`"no_procedure" IN (0, 1)`)),
    check(
      "visits_snapshot_hash_len",
      sql.raw(`("snapshot_hash" IS NULL OR length("snapshot_hash") = 64)`),
    ),
  ],
);
