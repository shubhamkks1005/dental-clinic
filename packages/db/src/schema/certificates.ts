import { CERTIFICATE_SIGN_METHODS, CERTIFICATE_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

/** 4.4.3 medical certificates. Finalised rows are locked; revise = new draft row. */
export const certificates = sqliteTable(
  "certificates",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    doctorId: text("doctor_id").notNull(),
    status: text("status", { enum: CERTIFICATE_STATUSES }).notNull().default("draft"),
    certNo: text("cert_no"),
    certPeriod: text("cert_period"),
    patientName: text("patient_name").notNull(),
    patientAge: text("patient_age").notNull(),
    patientAddress: text("patient_address").notNull().default(""),
    identificationMark: text("identification_mark").notNull(),
    signMethod: text("sign_method", { enum: CERTIFICATE_SIGN_METHODS }).notNull(),
    reason: text("reason").notNull(),
    fromOn: text("from_on").notNull(),
    toOn: text("to_on").notNull(),
    diagnosis: text("diagnosis"),
    doctorRegistrationNo: text("doctor_registration_no"),
    revisedFromId: text("revised_from_id"),
    finalisedAt: text("finalised_at"),
    finalisedBy: text("finalised_by"),
  },
  (t) => [
    index("certificates_patient_created_idx").on(t.patientId, t.createdAt),
    index("certificates_period_no_idx").on(t.certPeriod, t.certNo),
    check("certificates_status_check", oneOf(t.status.name, CERTIFICATE_STATUSES)),
    check("certificates_sign_method_check", oneOf(t.signMethod.name, CERTIFICATE_SIGN_METHODS)),
    check(
      "certificates_from_on_format",
      sql.raw(`"from_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check(
      "certificates_to_on_format",
      sql.raw(`"to_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);
