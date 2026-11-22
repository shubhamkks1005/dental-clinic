import { CONSENT_METHODS, CONSENT_TYPES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 2.1.9: append-only consent history. Withdrawal = a new row with given=0 (never UPDATE/DELETE).
export const consents = sqliteTable(
  "consents",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    type: text("type", { enum: CONSENT_TYPES }).notNull(),
    noticeVersion: integer("notice_version").notNull(),
    given: integer("given", { mode: "boolean" }).notNull(),
    givenAt: text("given_at").notNull(),
    recordedBy: text("recorded_by").notNull(),
    method: text("method", { enum: CONSENT_METHODS }).notNull(),
  },
  (t) => [
    index("consents_patient_id_idx").on(t.patientId),
    check("consents_type_check", oneOf(t.type.name, CONSENT_TYPES)),
    check("consents_method_check", oneOf(t.method.name, CONSENT_METHODS)),
    check("consents_notice_version_positive", sql.raw(`"notice_version" >= 1`)),
    check("consents_given_bool", sql.raw(`"given" IN (0, 1)`)),
  ],
);
