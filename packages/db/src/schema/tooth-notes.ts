import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

// Doctor visit page (B7): one short clinical note per patient and tooth, edited in place with a
// version check. Cleared notes are soft-deleted, so the history stays in audit_log. A clinical record:
// kept like tooth_events (docs/RETENTION.md). Finalised visits copy the live notes into their snapshot.
export const toothNotes = sqliteTable(
  "tooth_notes",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    toothFdi: integer("tooth_fdi").notNull(),
    body: text("body").notNull(),
  },
  (t) => [
    uniqueIndex("tooth_notes_live_uidx")
      .on(t.patientId, t.toothFdi)
      .where(sql`${t.deletedAt} IS NULL`),
    check(
      "tooth_notes_fdi_range",
      sql.raw(`("tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`),
    ),
    check("tooth_notes_body_len", sql.raw(`length(trim("body")) BETWEEN 1 AND 1000`)),
  ],
);
