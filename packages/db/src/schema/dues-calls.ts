import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/** 5.3.4: last-call notes on patients with outstanding dues. Append-only. */
export const duesCalls = sqliteTable(
  "dues_calls",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    note: text("note").notNull(),
    calledOn: text("called_on").notNull(),
  },
  (t) => [
    index("dues_calls_patient_created_idx").on(t.patientId, t.createdAt),
    check(
      "dues_calls_called_on_format",
      sql.raw(`"called_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);
