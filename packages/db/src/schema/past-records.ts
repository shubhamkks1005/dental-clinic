import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/** 6.7.3: doctor-only paper/past notes labelled "Added later" in History. */
export const pastRecords = sqliteTable(
  "past_records",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    /** Historical date (IST calendar day) the note is about. */
    recordedOn: text("recorded_on").notNull(),
    body: text("body").notNull(),
    /** Optional linked scan/consent file (files.id). */
    fileId: text("file_id"),
  },
  (t) => [
    index("past_records_patient_on_idx").on(t.patientId, t.recordedOn),
    check(
      "past_records_recorded_on_format",
      sql.raw(`"recorded_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check("past_records_body_len", sql.raw(`length(trim("body")) >= 1 AND length("body") <= 4000`)),
  ],
);
