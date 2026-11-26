import { BREAK_MAX_MINUTES, BREAK_MIN_MINUTES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/**
 * T1.2: the doctor's own break ("tired, 5 min"). It never moves or changes an appointment.
 * Growth cap: one open break per doctor at a time (partial unique index) and a purge after 90 days
 * (docs/RETENTION.md).
 */
export const doctorBreaks = sqliteTable(
  "doctor_breaks",
  {
    ...standardColumns(),
    // 0066: breaks are per doctor (the signed-in doctor who started it).
    doctorId: text("doctor_id"),
    startedAt: text("started_at").notNull(),
    dateLocal: text("date_local").notNull(),
    minutes: integer("minutes").notNull(),
    label: text("label").notNull(),
    endedAt: text("ended_at"),
  },
  (t) => [
    check(
      "doctor_breaks_minutes_range",
      sql.raw(`"minutes" BETWEEN ${BREAK_MIN_MINUTES} AND ${BREAK_MAX_MINUTES}`),
    ),
    check("doctor_breaks_label_len", sql.raw(`length("label") BETWEEN 1 AND 40`)),
    index("doctor_breaks_day_idx").on(t.dateLocal, t.startedAt),
    uniqueIndex("doctor_breaks_one_open_uidx")
      .on(t.doctorId, t.dateLocal)
      .where(sql.raw(`"ended_at" IS NULL AND "deleted_at" IS NULL`)),
  ],
);
