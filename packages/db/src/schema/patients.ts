import { PATIENT_GENDERS, PATIENT_MESSAGE_LANGUAGES, PATIENT_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 2.1.1 patient row. Guardian required under 18 (2.1.3). Search tokens (2.1.6), numbering (2.1.5).
// Soft delete via deleted_at; archive via status (2.1.8). Fake data only in seeds/tests.
export const patients = sqliteTable(
  "patients",
  {
    ...standardColumns(),
    code: text("code").notNull().unique(),
    fullName: text("full_name").notNull(),
    gender: text("gender", { enum: PATIENT_GENDERS }).notNull(),
    dateOfBirth: text("date_of_birth"),
    ageYearsAtReg: integer("age_years_at_reg"),
    mobile: text("mobile"),
    noMobileReason: text("no_mobile_reason"),
    mobileSecondary: text("mobile_secondary"),
    area: text("area"),
    email: text("email"),
    referralSourceId: text("referral_source_id"),
    referredBy: text("referred_by"),
    emergencyName: text("emergency_name"),
    emergencyRelation: text("emergency_relation"),
    emergencyMobile: text("emergency_mobile"),
    // 2.1.3: required by app rule when age on save day is under 18 (not a DB CHECK — DOB path).
    guardianName: text("guardian_name"),
    guardianRelation: text("guardian_relation"),
    guardianMobile: text("guardian_mobile"),
    messageLanguage: text("message_language", { enum: PATIENT_MESSAGE_LANGUAGES }),
    legacyRef: text("legacy_ref"),
    notes: text("notes"),
    status: text("status", { enum: PATIENT_STATUSES }).notNull().default("active"),
  },
  (t) => [
    check("patients_gender_check", oneOf(t.gender.name, PATIENT_GENDERS)),
    check("patients_status_check", oneOf(t.status.name, PATIENT_STATUSES)),
    check(
      "patients_message_language_check",
      sql.raw(
        `("message_language" IS NULL OR "message_language" IN (${PATIENT_MESSAGE_LANGUAGES.map((v) => `'${v}'`).join(", ")}))`,
      ),
    ),
    // Mobile present XOR a reason (exactly one of the two contact paths).
    check(
      "patients_mobile_or_reason",
      sql.raw(
        `(("mobile" IS NOT NULL AND "no_mobile_reason" IS NULL) OR ("mobile" IS NULL AND "no_mobile_reason" IS NOT NULL))`,
      ),
    ),
    // Age: DOB and/or age-at-registration; at least one required for a usable age (2.1.4 tightens).
    check(
      "patients_dob_or_age",
      sql.raw(`("date_of_birth" IS NOT NULL OR "age_years_at_reg" IS NOT NULL)`),
    ),
    check(
      "patients_age_years_range",
      sql.raw(
        `("age_years_at_reg" IS NULL OR ("age_years_at_reg" >= 0 AND "age_years_at_reg" <= 120))`,
      ),
    ),
  ],
);
