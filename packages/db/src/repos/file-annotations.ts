import {
  annotationsSchema,
  CLINICAL_FILE_KINDS,
  type FileAnnotations,
  type FileKind,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { files } from "../schema";
import { nowUtcSql } from "../sql";

export type FileAnnotationsRow = {
  fileId: string;
  version: number;
  annotations: FileAnnotations | null;
};

function parse(raw: string | null): FileAnnotations | null {
  if (!raw) return null;
  try {
    const result = annotationsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// B8: marks on an X-ray or photo. Doctor only (files.clinical); the file's own version is the lock,
// so two tabs cannot overwrite each other. The audit row keeps counts, not the drawing itself.
export function fileAnnotationsRepo(db: Db, ctx: Ctx) {
  async function load(fileId: string) {
    const row = await db
      .select({
        id: files.id,
        kind: files.kind,
        version: files.version,
        annotationsJson: files.annotationsJson,
      })
      .from(files)
      .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("File");
    if (!(CLINICAL_FILE_KINDS as readonly FileKind[]).includes(row.kind as FileKind)) {
      throw new InvalidError("Marks can only be drawn on an X-ray or a photo.");
    }
    return row;
  }

  return {
    async get(fileId: string): Promise<FileAnnotationsRow> {
      assertAllowed(ctx, "files.clinical");
      const row = await load(fileId);
      return { fileId, version: row.version, annotations: parse(row.annotationsJson) };
    },

    async save(
      fileId: string,
      version: number,
      annotations: FileAnnotations,
    ): Promise<FileAnnotationsRow> {
      assertAllowed(ctx, "files.clinical");
      const valid = annotationsSchema.safeParse(annotations);
      if (!valid.success) {
        throw new InvalidError(valid.error.issues[0]?.message ?? "Check the marks.");
      }
      const row = await load(fileId);
      if (row.version !== version) throw new ConflictError();
      const before = parse(row.annotationsJson);
      const summary = (a: FileAnnotations | null) => ({
        marks: a?.items.length ?? 0,
        calibrated: Boolean(a?.scale),
      });
      await db.batch([
        db
          .update(files)
          .set({
            annotationsJson: JSON.stringify(valid.data),
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(files.id, fileId), eq(files.version, version), isNull(files.deletedAt))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "files",
          rowId: fileId,
          before: { annotations: summary(before) },
          after: { annotations: summary(valid.data) },
        }),
      ]);
      const check = await db
        .select({ version: files.version })
        .from(files)
        .where(eq(files.id, fileId))
        .get();
      if (check?.version !== version + 1) throw new ConflictError();
      return { fileId, version: version + 1, annotations: valid.data };
    },
  };
}
