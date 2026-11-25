import { FILE_KINDS, FILE_MIME_TYPES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Metadata only; bytes live in private object storage and are served through the Worker after auth.
// patient_id NULL = clinic file (logo). r2_key holds the storage object key (R2 or S3/B2).
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
    // 3.7.2: original name for display; object key stays random.
    originalFilename: text("original_filename").notNull().default(""),
    caption: text("caption"),
    toothFdi: integer("tooth_fdi"),
    takenOn: text("taken_on"),
    thumbKey: text("thumb_key"),
    // B8: pen / circle / arrow / text / measure marks as versioned JSON (max 64 KB), doctor only.
    annotationsJson: text("annotations_json"),
  },
  (t) => [
    index("files_patient_created_idx").on(t.patientId, t.createdAt),
    check("files_kind_check", oneOf(t.kind.name, FILE_KINDS)),
    check("files_mime_check", oneOf(t.mime.name, FILE_MIME_TYPES)),
    check(
      "files_annotations_json",
      sql.raw(
        `("annotations_json" IS NULL OR (json_valid("annotations_json") AND length("annotations_json") <= 65536))`,
      ),
    ),
    check("files_bytes_positive", sql.raw(`"bytes" > 0`)),
    check("files_sha256_length", sql.raw(`length("sha256") = 64`)),
    check(
      "files_tooth_fdi",
      sql.raw(
        `("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)`,
      ),
    ),
  ],
);
