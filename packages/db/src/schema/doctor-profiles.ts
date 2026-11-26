import { sql } from "drizzle-orm";
import { check, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/**
 * 0066: each doctor's own prescription letterhead lines (owner 2026-11-26). One row per doctor,
 * edited by that doctor in Settings. Growth cap: one row per user (unique index).
 */
export const doctorProfiles = sqliteTable(
  "doctor_profiles",
  {
    ...standardColumns(),
    userId: text("user_id").notNull(),
    nameOnRx: text("name_on_rx").notNull(),
    qualifications: text("qualifications").notNull().default(""),
    speciality: text("speciality").notNull().default(""),
    registrationNo: text("registration_no").notNull().default(""),
    extraLine: text("extra_line").notNull().default(""),
  },
  (t) => [
    check("doctor_profiles_name_len", sql.raw(`length("name_on_rx") BETWEEN 1 AND 80`)),
    check("doctor_profiles_qual_len", sql.raw(`length("qualifications") <= 120`)),
    check("doctor_profiles_spec_len", sql.raw(`length("speciality") <= 80`)),
    check("doctor_profiles_reg_len", sql.raw(`length("registration_no") <= 40`)),
    check("doctor_profiles_extra_len", sql.raw(`length("extra_line") <= 120`)),
    uniqueIndex("doctor_profiles_user_uidx").on(t.userId),
  ],
);
