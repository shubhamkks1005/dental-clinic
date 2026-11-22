import { newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems, visitDiagnoses, visits } from "../schema";

export type AddVisitDiagnosisInput = {
  visitId: string;
  /** Pick from diagnoses list, or omit and pass freeText. */
  listItemId?: string | null;
  freeText?: string | null;
  toothFdi?: number | null;
};

export type VisitDiagnosisRow = {
  id: string;
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
      ]);
      return {
        id,
        visitId: input.visitId,
        listItemId,
        label,
        toothFdi: input.toothFdi ?? null,
        sortOrder,
      };
    },
  };
}
