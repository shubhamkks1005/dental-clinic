import { PRESCRIPTION_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 4.2.1 prescriptions. Issued/revised rows are locked; revise = new row (revised_from_id).
export const prescriptions = sqliteTable(
  "prescriptions",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    visitId: text("visit_id"),
    doctorId: text("doctor_id").notNull(),
    weightKg: integer("weight_kg"),
    advice: text("advice"),
    followUpOn: text("follow_up_on"),
    status: text("status", { enum: PRESCRIPTION_STATUSES }).notNull().default("draft"),
    rxNo: text("rx_no"),
    rxPeriod: text("rx_period"),
    dentistDispensed: integer("dentist_dispensed", { mode: "boolean" }).notNull().default(false),
    dentistDispensedNote: text("dentist_dispensed_note"),
    revisedFromId: text("revised_from_id"),
    issuedAt: text("issued_at"),
    issuedBy: text("issued_by"),
    shareWithPortal: integer("share_with_portal", { mode: "boolean" }).notNull().default(false),
    // 0067: NOT USED. An issued prescription is never updated (AGENTS data rules), so the desk print
    // request is a print_log row (prescription_desk_request). Kept because 0067 is locked (1.2.2).
    deskPrintRequestedAt: text("desk_print_requested_at"),
    deskPrintRequestedBy: text("desk_print_requested_by"),
    deskPrintedAt: text("desk_printed_at"),
  },
  (t) => [
    index("prescriptions_patient_created_idx").on(t.patientId, t.createdAt),
    index("prescriptions_visit_idx").on(t.visitId),
    index("prescriptions_doctor_status_idx").on(t.doctorId, t.status),
    check("prescriptions_status_check", oneOf(t.status.name, PRESCRIPTION_STATUSES)),
    check(
      "prescriptions_follow_up_on_format",
      sql.raw(
        `("follow_up_on" IS NULL OR "follow_up_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`,
      ),
    ),
    check("prescriptions_weight_positive", sql.raw(`("weight_kg" IS NULL OR "weight_kg" > 0)`)),
    check("prescriptions_dispensed_bool", sql.raw(`"dentist_dispensed" IN (0, 1)`)),
    check("prescriptions_share_bool", sql.raw(`"share_with_portal" IN (0, 1)`)),
  ],
);

// Snapshot of each medicine line; master list edits never rewrite these.
export const prescriptionItems = sqliteTable(
  "prescription_items",
  {
    ...standardColumns(),
    prescriptionId: text("prescription_id").notNull(),
    medicineId: text("medicine_id"),
    genericName: text("generic_name").notNull(),
    brand: text("brand").notNull().default(""),
    form: text("form").notNull(),
    strength: text("strength").notNull().default(""),
    dose: text("dose").notNull(),
    frequency: text("frequency").notNull(),
    days: text("days").notNull(),
    timing: text("timing").notNull(),
    instruction: text("instruction").notNull().default(""),
    tags: text("tags").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("prescription_items_rx_idx").on(t.prescriptionId, t.sortOrder)],
);
