import type { ToothSurface } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { visitProcedures, visits } from "../schema";
import { nowUtcSql } from "../sql";
import type { VisitProcedureRow } from "./visit-procedures";
import { assertSurfaces, assertTooth, parseSurfaces } from "./visit-line-parts";

export type UpdateVisitProcedureInput = {
  toothFdi?: number | null;
  surfaces?: ToothSurface[];
  note?: string | null;
};

// 3.2.3: change, remove (soft delete) and restore a procedure line on a draft visit.
export function visitProcedureEditRepo(db: Db, ctx: Ctx) {
  return {
    async update(lineId: string, version: number, input: UpdateVisitProcedureInput) {
      assertAllowed(ctx, "clinical.edit");
      assertTooth(input.toothFdi);
      assertSurfaces(input.surfaces);
      const line = await loadLine(db, lineId, "live");
      if (line.version !== version) throw new ConflictError();
      const surfaces = input.surfaces ? [...new Set(input.surfaces)] : undefined;
      const note = input.note === undefined ? undefined : input.note?.trim() || null;
      await db.batch([
        db
          .update(visitProcedures)
          .set({
            ...(input.toothFdi !== undefined ? { toothFdi: input.toothFdi } : {}),
            ...(surfaces ? { surfacesJson: JSON.stringify(surfaces) } : {}),
            ...(note !== undefined ? { note } : {}),
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(visitProcedures.id, lineId),
              eq(visitProcedures.version, version),
              isNull(visitProcedures.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "visit_procedures",
          rowId: lineId,
          before: {
            toothFdi: line.toothFdi,
            surfaces: parseSurfaces(line.surfacesJson),
            note: line.note,
          },
          after: {
            toothFdi: input.toothFdi === undefined ? line.toothFdi : input.toothFdi,
            surfaces: surfaces ?? parseSurfaces(line.surfacesJson),
            note: note === undefined ? line.note : note,
          },
        }),
      ]);
      return readLine(db, lineId, version + 1, false);
    },

    /** Soft delete (draft only). The reply carries the new version, which Undo needs. */
    async remove(lineId: string, version: number): Promise<{ version: number }> {
      assertAllowed(ctx, "clinical.edit");
      const line = await loadLine(db, lineId, "live");
      if (line.version !== version) throw new ConflictError();
      await db.batch([
        db
          .update(visitProcedures)
          .set({
            deletedAt: nowUtcSql,
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(visitProcedures.id, lineId),
              eq(visitProcedures.version, version),
              isNull(visitProcedures.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "delete",
          table: "visit_procedures",
          rowId: lineId,
          before: { label: line.label, toothFdi: line.toothFdi },
        }),
      ]);
      await readLine(db, lineId, version + 1, true);
      return { version: version + 1 };
    },

    /** Undo of remove: clears the soft delete (draft only). */
    async restore(lineId: string, version: number) {
      assertAllowed(ctx, "clinical.edit");
      const line = await loadLine(db, lineId, "deleted");
      if (line.version !== version) throw new ConflictError();
      await db.batch([
        db
          .update(visitProcedures)
          .set({
            deletedAt: null,
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(visitProcedures.id, lineId), eq(visitProcedures.version, version))),
        auditInsertIfChanged(db, ctx, {
          action: "restore",
          table: "visit_procedures",
          rowId: lineId,
          after: { label: line.label, toothFdi: line.toothFdi },
        }),
      ]);
      return readLine(db, lineId, version + 1, false);
    },
  };
}

// One query: the line and its visit status. "live" wants a line not yet removed; "deleted" the opposite.
async function loadLine(db: Db, lineId: string, want: "live" | "deleted") {
  const row = await db
    .select({
      id: visitProcedures.id,
      version: visitProcedures.version,
      label: visitProcedures.label,
      toothFdi: visitProcedures.toothFdi,
      surfacesJson: visitProcedures.surfacesJson,
      note: visitProcedures.note,
      deletedAt: visitProcedures.deletedAt,
      visitStatus: visits.status,
    })
    .from(visitProcedures)
    .innerJoin(visits, eq(visits.id, visitProcedures.visitId))
    .where(eq(visitProcedures.id, lineId))
    .get();
  if (!row || (want === "live") !== (row.deletedAt === null)) {
    throw new NotFoundError("That procedure");
  }
  if (row.visitStatus !== "draft") {
    throw new InvalidError("This visit is finalised. Add an addendum instead of editing it.");
  }
  return row;
}

// Reads the line back after a write to confirm the version moved (a lost race throws).
async function readLine(
  db: Db,
  lineId: string,
  expectVersion: number,
  deleted: boolean,
): Promise<VisitProcedureRow> {
  const row = await db
    .select({
      id: visitProcedures.id,
      version: visitProcedures.version,
      visitId: visitProcedures.visitId,
      listItemId: visitProcedures.listItemId,
      label: visitProcedures.label,
      toothFdi: visitProcedures.toothFdi,
      surfacesJson: visitProcedures.surfacesJson,
      note: visitProcedures.note,
      defaultPaise: visitProcedures.defaultPaise,
      sortOrder: visitProcedures.sortOrder,
      deletedAt: visitProcedures.deletedAt,
    })
    .from(visitProcedures)
    .where(eq(visitProcedures.id, lineId))
    .get();
  if (!row || row.version !== expectVersion || (row.deletedAt !== null) !== deleted) {
    throw new ConflictError("Could not save. Reload the visit and try again.");
  }
  return {
    id: row.id,
    version: row.version,
    visitId: row.visitId,
    listItemId: row.listItemId,
    label: row.label,
    toothFdi: row.toothFdi,
    surfaces: parseSurfaces(row.surfacesJson),
    note: row.note,
    defaultPaise: row.defaultPaise,
    sortOrder: row.sortOrder,
  };
}
