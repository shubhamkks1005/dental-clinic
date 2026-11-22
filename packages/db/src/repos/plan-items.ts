import { newUlid, type CreatePlanItemInput } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, planItems } from "../schema";
import type { PlanItemDetail, PlanItemRow } from "./plan-items-types";
import { changeEstimate, setDecision } from "./plan-items-update";

function toDetail(row: typeof planItems.$inferSelect): PlanItemDetail {
  return {
    id: row.id,
    patientId: row.patientId,
    toothFdi: row.toothFdi,
    listItemId: row.listItemId,
    procedureLabel: row.procedureLabel,
    estimatePaise: row.estimatePaise,
    phase: row.phase,
    status: row.status,
    sittings: row.sittings,
    toldOn: row.toldOn,
    createdVisitId: row.createdVisitId,
    completedVisitId: row.completedVisitId,
    version: row.version,
    createdAt: row.createdAt,
  };
}

// 3.2.5 / 3.6.1: create + list plan items.
export function planItemsRepo(db: Db, ctx: Ctx) {
  return {
    async listForPatient(patientId: string): Promise<PlanItemDetail[]> {
      assertAllowed(ctx, "clinical.view");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const rows = await db
        .select()
        .from(planItems)
        .where(and(eq(planItems.patientId, patientId), isNull(planItems.deletedAt)))
        .orderBy(asc(planItems.phase), asc(planItems.createdAt))
        .all();
      return rows.map(toDetail);
    },

    async create(input: CreatePlanItemInput): Promise<PlanItemRow> {
      assertAllowed(ctx, "clinical.edit");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const id = newUlid();
      await db.batch([
        db.insert(planItems).values({
          id,
          patientId: input.patientId,
          toothFdi: input.toothFdi ?? null,
          listItemId: input.listItemId ?? null,
          procedureLabel: input.procedureLabel,
          estimatePaise: input.estimatePaise,
          phase: input.phase,
          sittings: input.sittings,
          status: "planned",
          createdVisitId: input.createdVisitId ?? null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "plan_items",
          rowId: id,
          after: {
            patientId: input.patientId,
            procedureLabel: input.procedureLabel,
            estimatePaise: input.estimatePaise,
            phase: input.phase,
          },
        }),
      ]);
      return {
        id,
        patientId: input.patientId,
        procedureLabel: input.procedureLabel,
        estimatePaise: input.estimatePaise,
        status: "planned",
        version: 1,
      };
    },

    changeEstimate: (id: string, input: Parameters<typeof changeEstimate>[3]) =>
      changeEstimate(db, ctx, id, input),

    setDecision: (id: string, input: Parameters<typeof setDecision>[3]) =>
      setDecision(db, ctx, id, input),
  };
}

export type { PlanItemDetail, PlanItemRow } from "./plan-items-types";
