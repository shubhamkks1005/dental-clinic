import { FILE_KINDS, FILE_MIME_TYPES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Metadata only; the bytes live in private R2 and are served through the Worker after auth.
// patient_id gets its foreign key when the patients table exists (Phase 2); NULL = clinic file (logo).
export const files = sqliteTable(
  "files",
  {
    ...standardColumns(),
    patientId: text("patient_id"),
    r2Key: text("r2_key").notNull().unique(),
    kind: text("kind", { enum: FILE_KINDS }).notNull(),
    mime: text("mime", { enum: FILE_MIME_TYPES }).notNull(),
    bytes: integer("bytes").notNull(),
    sha256: text("sha256").notNull(),
  },
  (t) => [
    check("files_kind_check", oneOf(t.kind.name, FILE_KINDS)),
    check("files_mime_check", oneOf(t.mime.name, FILE_MIME_TYPES)),
    check("files_bytes_positive", sql.raw(`"bytes" > 0`)),
    check("files_sha256_length", sql.raw(`length("sha256") = 64`)),
  ],
);
