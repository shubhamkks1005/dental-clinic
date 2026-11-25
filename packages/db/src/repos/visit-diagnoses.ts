import { newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems, visitDiagnoses, visits } from "../schema";
import { nowUtcSql } from "../sql";
import { assertTooth } from "./visit-line-parts";

export type AddVisitDiagnosisInput = {
  visitId: string;
  /** Pick from diagnoses list, or omit and pass freeText. */
  listItemId?: string | null;
  freeText?: string | null;
  toothFdi?: number | null;
};

export type UpdateVisitDiagnosisInput = {
  /** FDI number, or null to clear the tooth. */
  toothFdi: number | null;
};

export type VisitDiagnosisRow = {
  id: string;
  version: number;
  visitId: string;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  sortOrder: number;
};

// 3.2.3: attach a diagnosis (list or free text) to a draft visit.
export function visitDiagnosesRepo(db: Db, ctx: Ctx) {
  return {
    async listForVisit(visitId: string): Promise<VisitDiagnosisRow[]> {
      assertAllowed(ctx, "clinical.view");
      const rows = await db
        .select({
          id: visitDiagnoses.id,
          version: visitDiagnoses.version,
          visitId: visitDiagnoses.visitId,
          listItemId: visitDiagnoses.listItemId,
          label: visitDiagnoses.label,
          toothFdi: visitDiagnoses.toothFdi,
          sortOrder: visitDiagnoses.sortOrder,
        })
        .from(visitDiagnoses)
        .where(and(eq(visitDiagnoses.visitId, visitId), isNull(visitDiagnoses.deletedAt)))
        .orderBy(asc(visitDiagnoses.sortOrder), asc(visitDiagnoses.createdAt));
      return rows;
    },

    async add(input: AddVisitDiagnosisInput): Promise<VisitDiagnosisRow> {
      assertAllowed(ctx, "clinical.edit");
      assertTooth(input.toothFdi);
      const visit = await db
        .select({ id: visits.id, status: visits.status })
        .from(visits)
        .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      if (visit.status !== "draft") {
        throw new InvalidError("Diagnoses can only be added to a draft visit.");
      }

      let label = (input.freeText ?? "").trim();
      let listItemId: string | null = null;
      if (input.listItemId) {
        const item = await db
          .select({
            id: listItems.id,
            label: listItems.label,
            listKey: listItems.listKey,
            active: listItems.active,
          })
          .from(listItems)
          .where(and(eq(listItems.id, input.listItemId), isNull(listItems.deletedAt)))
          .get();
        if (!item || item.listKey !== "diagnoses" || !item.active) {
          throw new NotFoundError("That diagnosis");
        }
        label = item.label;
        listItemId = item.id;
      }
      if (!label) throw new InvalidError("Enter a diagnosis or pick one from the list.");

      const max = await db
        .select({ sortOrder: visitDiagnoses.sortOrder })
        .from(visitDiagnoses)
        .where(and(eq(visitDiagnoses.visitId, input.visitId), isNull(visitDiagnoses.deletedAt)))
        .orderBy(asc(visitDiagnoses.sortOrder))
        .all();
      const sortOrder = max.length === 0 ? 1 : Math.max(...max.map((r) => r.sortOrder)) + 1;

      const id = newUlid();
      await db.batch([
        db.insert(visitDiagnoses).values({
          id,
          visitId: input.visitId,
          listItemId,
          label,
          toothFdi: input.toothFdi ?? null,
          sortOrder,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "visit_diagnoses",
          rowId: id,
          after: { visitId: input.visitId, label, listItemId, toothFdi: input.toothFdi ?? null },
        }),
        db.update(visits).set({ noDiagnosis: false }).where(eq(visits.id, input.visitId)),
      ]);
      return {
        id,
        version: 1,
        visitId: input.visitId,
        listItemId,
        label,
        toothFdi: input.toothFdi ?? null,
        sortOrder,
      };
    },

    async update(
      lineId: string,
      version: number,
      input: UpdateVisitDiagnosisInput,
      visitId?: string,
    ) {
      assertAllowed(ctx, "clinical.edit");
      assertTooth(input.toothFdi);
      const line = await loadLine(db, lineId, "live", visitId);
      if (line.version !== version) throw new ConflictError();
      await db.batch([
        db
          .update(visitDiagnoses)
          .set({
            toothFdi: input.toothFdi,
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(visitDiagnoses.id, lineId),
              eq(visitDiagnoses.version, version),
              isNull(visitDiagnoses.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "visit_diagnoses",
          rowId: lineId,
          before: { toothFdi: line.toothFdi },
          after: { toothFdi: input.toothFdi },
        }),
      ]);
      return readLine(db, lineId, version + 1);
    },

    /** Soft delete (draft only). The reply carries the new version, which Undo needs. */
    async remove(lineId: string, version: number, visitId?: string): Promise<{ version: number }> {
      assertAllowed(ctx, "clinical.edit");
      const line = await loadLine(db, lineId, "live", visitId);
      if (line.version !== version) throw new ConflictError();
      await db.batch([
        db
          .update(visitDiagnoses)
          .set({
            deletedAt: nowUtcSql,
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(visitDiagnoses.id, lineId),
              eq(visitDiagnoses.version, version),
              isNull(visitDiagnoses.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "delete",
          table: "visit_diagnoses",
          rowId: lineId,
          before: { label: line.label, toothFdi: line.toothFdi },
        }),
      ]);
      await readLine(db, lineId, version + 1, true);
      return { version: version + 1 };
    },

    /** Undo of remove: clears the soft delete (draft only). */
    async restore(lineId: string, version: number, visitId?: string) {
      assertAllowed(ctx, "clinical.edit");
      const line = await loadLine(db, lineId, "deleted", visitId);
      if (line.version !== version) throw new ConflictError();
      await db.batch([
        db
          .update(visitDiagnoses)
          .set({
            deletedAt: null,
            version: version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(visitDiagnoses.id, lineId), eq(visitDiagnoses.version, version))),
        auditInsertIfChanged(db, ctx, {
          action: "restore",
          table: "visit_diagnoses",
          rowId: lineId,
          after: { label: line.label, toothFdi: line.toothFdi },
        }),
        db.update(visits).set({ noDiagnosis: false }).where(eq(visits.id, line.visitId)),
      ]);
      return readLine(db, lineId, version + 1);
    },
  };
}

// One query: the line and its visit status. "live" wants a line not yet removed; "deleted" the opposite.
async function loadLine(db: Db, lineId: string, want: "live" | "deleted", visitId?: string) {
  const row = await db
    .select({
      id: visitDiagnoses.id,
      version: visitDiagnoses.version,
      label: visitDiagnoses.label,
      toothFdi: visitDiagnoses.toothFdi,
      deletedAt: visitDiagnoses.deletedAt,
      visitStatus: visits.status,
      visitId: visitDiagnoses.visitId,
    })
    .from(visitDiagnoses)
    .innerJoin(visits, eq(visits.id, visitDiagnoses.visitId))
    .where(eq(visitDiagnoses.id, lineId))
    .get();
  if (
    !row ||
    (visitId && row.visitId !== visitId) ||
    (want === "live") !== (row.deletedAt === null)
  ) {
    throw new NotFoundError("That diagnosis");
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
  deleted = false,
): Promise<VisitDiagnosisRow> {
  const row = await db
    .select({
      id: visitDiagnoses.id,
      version: visitDiagnoses.version,
      visitId: visitDiagnoses.visitId,
      listItemId: visitDiagnoses.listItemId,
      label: visitDiagnoses.label,
      toothFdi: visitDiagnoses.toothFdi,
      sortOrder: visitDiagnoses.sortOrder,
      deletedAt: visitDiagnoses.deletedAt,
    })
    .from(visitDiagnoses)
    .where(eq(visitDiagnoses.id, lineId))
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
    sortOrder: row.sortOrder,
  };
}
