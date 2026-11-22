import {
  actionForFileKind,
  newUlid,
  type FileKind,
  type FileMimeType,
  type FileRow,
} from "@clinic/shared";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { accessInsert, auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { files, patients } from "../schema";

export type InsertFileInput = {
  patientId: string;
  objectKey: string;
  kind: FileKind;
  mime: FileMimeType;
  bytes: number;
  sha256: string;
  originalFilename: string;
  caption?: string | null;
  toothFdi?: number | null;
  takenOn?: string | null;
  thumbKey?: string | null;
};

export type FileRecord = FileRow & { objectKey: string; thumbKey: string | null };

function assertKindAllowed(ctx: Ctx, kind: FileKind): void {
  const action = actionForFileKind(kind);
  if (!action) throw new ForbiddenError();
  assertAllowed(ctx, action);
}

function toRow(r: {
  id: string;
  patientId: string | null;
  kind: string;
  mime: string;
  bytes: number;
  sha256: string;
  originalFilename: string;
  caption: string | null;
  toothFdi: number | null;
  takenOn: string | null;
  thumbKey?: string | null;
  createdAt: string;
  createdBy: string;
}): FileRow {
  return {
    id: r.id,
    patientId: r.patientId,
    kind: r.kind as FileKind,
    mime: r.mime as FileMimeType,
    bytes: r.bytes,
    sha256: r.sha256,
    originalFilename: r.originalFilename,
    caption: r.caption,
    toothFdi: r.toothFdi,
    takenOn: r.takenOn,
    hasThumb: Boolean(r.thumbKey),
    createdAt: r.createdAt,
    createdBy: r.createdBy,
  };
}

export function filesRepo(db: Db, ctx: Ctx) {
  async function requirePatient(patientId: string): Promise<void> {
    const hit = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
      .get();
    if (!hit) throw new NotFoundError("Patient");
  }

  return {
    /** Any files route: doctor or receptionist (kind still filtered later). */
    assertCanAccessFiles(): void {
      if (!isAllowed(ctx.role, "files.clinical") && !isAllowed(ctx.role, "files.documents")) {
        throw new ForbiddenError();
      }
    },

    async listForPatient(patientId: string): Promise<FileRow[]> {
      assertAllowed(ctx, "patients.view");
      this.assertCanAccessFiles();
      await requirePatient(patientId);

      const rows = await db
        .select({
          id: files.id,
          patientId: files.patientId,
          kind: files.kind,
          mime: files.mime,
          bytes: files.bytes,
          sha256: files.sha256,
          originalFilename: files.originalFilename,
          caption: files.caption,
          toothFdi: files.toothFdi,
          takenOn: files.takenOn,
          thumbKey: files.thumbKey,
          createdAt: files.createdAt,
          createdBy: files.createdBy,
        })
        .from(files)
        .where(and(eq(files.patientId, patientId), isNull(files.deletedAt)))
        .orderBy(desc(files.createdAt), desc(files.id))
        .all();

      return rows
        .map((r) => toRow(r))
        .filter((r) => {
          const action = actionForFileKind(r.kind);
          return action ? isAllowed(ctx.role, action) : false;
        });
    },

    async getById(id: string): Promise<FileRecord> {
      const row = await db
        .select()
        .from(files)
        .where(and(eq(files.id, id), isNull(files.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("File");
      assertKindAllowed(ctx, row.kind as FileKind);
      return {
        ...toRow({
          id: row.id,
          patientId: row.patientId,
          kind: row.kind,
          mime: row.mime,
          bytes: row.bytes,
          sha256: row.sha256,
          originalFilename: row.originalFilename,
          caption: row.caption,
          toothFdi: row.toothFdi,
          takenOn: row.takenOn,
          thumbKey: row.thumbKey,
          createdAt: row.createdAt,
          createdBy: row.createdBy,
        }),
        objectKey: row.r2Key,
        thumbKey: row.thumbKey,
      };
    },

    async insert(input: InsertFileInput): Promise<FileRow> {
      assertKindAllowed(ctx, input.kind);
      await requirePatient(input.patientId);
      if (!input.originalFilename.trim()) {
        throw new InvalidError("Original filename is required.");
      }
      if (input.bytes <= 0) throw new InvalidError("File is empty.");
      if (input.sha256.length !== 64) throw new InvalidError("SHA-256 must be 64 hex characters.");

      const id = newUlid();
      await db.batch([
        db.insert(files).values({
          id,
          patientId: input.patientId,
          r2Key: input.objectKey,
          kind: input.kind,
          mime: input.mime,
          bytes: input.bytes,
          sha256: input.sha256,
          originalFilename: input.originalFilename.trim().slice(0, 200),
          caption: input.caption?.trim() || null,
          toothFdi: input.toothFdi ?? null,
          takenOn: input.takenOn ?? null,
          thumbKey: input.thumbKey ?? null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "files",
          rowId: id,
          after: {
            patientId: input.patientId,
            kind: input.kind,
            bytes: input.bytes,
            sha256: input.sha256,
          },
        }),
      ]);
      const saved = await db.select().from(files).where(eq(files.id, id)).get();
      if (!saved) throw new NotFoundError("File");
      return toRow({
        id: saved.id,
        patientId: saved.patientId,
        kind: saved.kind,
        mime: saved.mime,
        bytes: saved.bytes,
        sha256: saved.sha256,
        originalFilename: saved.originalFilename,
        caption: saved.caption,
        toothFdi: saved.toothFdi,
        takenOn: saved.takenOn,
        thumbKey: saved.thumbKey,
        createdAt: saved.createdAt,
        createdBy: saved.createdBy,
      });
    },

    async recordView(id: string): Promise<FileRecord> {
      const row = await this.getById(id);
      await accessInsert(db, ctx, {
        action: "view",
        resource: "file",
        resourceId: row.id,
        detail: `${row.kind}`,
      });
      return row;
    },

    async softDelete(id: string): Promise<void> {
      const row = await db
        .select()
        .from(files)
        .where(and(eq(files.id, id), isNull(files.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("File");
      assertKindAllowed(ctx, row.kind as FileKind);
      const now = new Date().toISOString();
      await db.batch([
        db
          .update(files)
          .set({
            deletedAt: now,
            updatedAt: now,
            updatedBy: ctx.userId,
            version: row.version + 1,
          })
          .where(and(eq(files.id, id), isNull(files.deletedAt))),
        auditInsert(db, ctx, {
          action: "delete",
          table: "files",
          rowId: id,
          before: { kind: row.kind, patientId: row.patientId, bytes: row.bytes },
        }),
      ]);
    },

    async totalBytes(): Promise<number> {
      assertAllowed(ctx, "settings.read");
      const row = await db
        .select({ total: sql<number>`coalesce(sum(${files.bytes}), 0)` })
        .from(files)
        .where(isNull(files.deletedAt))
        .get();
      return Number(row?.total ?? 0);
    },
  };
}
