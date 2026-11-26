import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/**
 * 0066: a doctor's leave day (owner 2026-11-26). Booking on it is a soft rule, never blocked.
 * Growth cap: one live row per doctor per day, and a purge after 2 years (docs/RETENTION.md).
 */
export const doctorLeaves = sqliteTable(
  "doctor_leaves",
  {
    ...standardColumns(),
    doctorId: text("doctor_id").notNull(),
    dateLocal: text("date_local").notNull(),
    note: text("note"),
  },
  (t) => [
    check(
      "doctor_leaves_date_local_format",
      sql.raw(`"date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check("doctor_leaves_note_len", sql.raw(`"note" IS NULL OR length("note") <= 100`)),
    uniqueIndex("doctor_leaves_one_live_uidx")
      .on(t.doctorId, t.dateLocal)
      .where(sql.raw(`"deleted_at" IS NULL`)),
    index("doctor_leaves_day_idx").on(t.dateLocal),
  ],
);
