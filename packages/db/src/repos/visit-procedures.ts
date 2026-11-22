import { isToothSurface, newUlid, type ToothSurface } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems, visitProcedures, visits } from "../schema";

export type AddVisitProcedureInput = {
  visitId: string;
  listItemId: string;
  toothFdi?: number | null;
  surfaces?: ToothSurface[];
  note?: string | null;
};

export type VisitProcedureRow = {
  id: string;
  visitId: string;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  surfaces: ToothSurface[];
  note: string | null;
  defaultPaise: number | null;
  sortOrder: number;
};

function parseSurfaces(raw: string): ToothSurface[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is ToothSurface => typeof s === "string" && isToothSurface(s));
  } catch {
    return [];
  }
}

// 3.2.3 / 3.5.4: attach a procedure from the procedures list to a draft visit.
export function visitProceduresRepo(db: Db, ctx: Ctx) {
  return {
    async listForVisit(visitId: string): Promise<VisitProcedureRow[]> {
      assertAllowed(ctx, "clinical.view");
      const rows = await db
        .select({
          id: visitProcedures.id,
          visitId: visitProcedures.visitId,
          listItemId: visitProcedures.listItemId,
          label: visitProcedures.label,
          toothFdi: visitProcedures.toothFdi,
          surfacesJson: visitProcedures.surfacesJson,
          note: visitProcedures.note,
          defaultPaise: visitProcedures.defaultPaise,
          sortOrder: visitProcedures.sortOrder,
        })
        .from(visitProcedures)
        .where(and(eq(visitProcedures.visitId, visitId), isNull(visitProcedures.deletedAt)))
        .orderBy(asc(visitProcedures.sortOrder), asc(visitProcedures.createdAt));
      return rows.map((r) => ({
        id: r.id,
        visitId: r.visitId,
        listItemId: r.listItemId,
        label: r.label,
        toothFdi: r.toothFdi,
        surfaces: parseSurfaces(r.surfacesJson),
        note: r.note,
        defaultPaise: r.defaultPaise,
        sortOrder: r.sortOrder,
      }));
    },

    async add(input: AddVisitProcedureInput): Promise<VisitProcedureRow> {
      assertAllowed(ctx, "clinical.edit");
      const visit = await db
        .select({ id: visits.id, status: visits.status })
        .from(visits)
        .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      if (visit.status !== "draft") {
        throw new InvalidError("Procedures can only be added to a draft visit.");
      }

      const item = await db
        .select({
          id: listItems.id,
          label: listItems.label,
          listKey: listItems.listKey,
          active: listItems.active,
          dataJson: listItems.dataJson,
        })
        .from(listItems)
        .where(and(eq(listItems.id, input.listItemId), isNull(listItems.deletedAt)))
        .get();
      if (!item || item.listKey !== "procedures" || !item.active) {
        throw new NotFoundError("That procedure");
      }

      let defaultPaise: number | null = null;
      try {
        const data = JSON.parse(item.dataJson) as { default_paise?: number };
        if (typeof data.default_paise === "number" && Number.isInteger(data.default_paise)) {
          defaultPaise = data.default_paise;
        }
      } catch {
        defaultPaise = null;
      }

      const surfaces = input.surfaces ?? [];
      const max = await db
        .select({ sortOrder: visitProcedures.sortOrder })
        .from(visitProcedures)
        .where(and(eq(visitProcedures.visitId, input.visitId), isNull(visitProcedures.deletedAt)))
        .orderBy(asc(visitProcedures.sortOrder))
        .all();
      const sortOrder = max.length === 0 ? 1 : Math.max(...max.map((r) => r.sortOrder)) + 1;

      const id = newUlid();
      const note = input.note?.trim() || null;
      await db.batch([
        db.insert(visitProcedures).values({
          id,
          visitId: input.visitId,
          listItemId: item.id,
          label: item.label,
          toothFdi: input.toothFdi ?? null,
          surfacesJson: JSON.stringify(surfaces),
          note,
          defaultPaise,
          sortOrder,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "visit_procedures",
          rowId: id,
          after: {
            visitId: input.visitId,
            label: item.label,
            toothFdi: input.toothFdi ?? null,
            surfaces,
          },
        }),
      ]);
      return {
        id,
        visitId: input.visitId,
        listItemId: item.id,
        label: item.label,
        toothFdi: input.toothFdi ?? null,
        surfaces,
        note,
        defaultPaise,
        sortOrder,
      };
    },
  };
}
