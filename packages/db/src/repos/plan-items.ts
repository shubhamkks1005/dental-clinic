import {
  newUlid,
  type ChangeEstimateInput,
  type CreatePlanItemInput,
  type PlanItemStatus,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, planItems, planItemVersions } from "../schema";
import { nowUtcSql } from "../sql";

export type PlanItemRow = {
  id: string;
  patientId: string;
  procedureLabel: string;
  estimatePaise: number;
  status: PlanItemStatus;
  version: number;
};

export function planItemsRepo(db: Db, ctx: Ctx) {
  return {
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

    async changeEstimate(id: string, input: ChangeEstimateInput): Promise<PlanItemRow> {
      assertAllowed(ctx, "clinical.edit");
      const reason = input.reason.trim();
      if (!reason) throw new InvalidError("Enter a reason when changing the estimate.");

      const row = await db
        .select()
        .from(planItems)
        .where(and(eq(planItems.id, id), isNull(planItems.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That plan item");
      if (row.version !== input.version) throw new ConflictError();
      if (input.estimatePaise > row.estimatePaise && reason.length === 0) {
        throw new InvalidError("Enter a reason when increasing the estimate.");
      }

      const changedAt = new Date().toISOString();
      const versionId = newUlid();
      await db.batch([
        db
          .update(planItems)
          .set({
            estimatePaise: input.estimatePaise,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(planItems.id, id), eq(planItems.version, input.version))),
        db.insert(planItemVersions).values({
          id: versionId,
          planItemId: id,
          estimatePaise: row.estimatePaise,
          reason,
          changedAt,
          changedBy: ctx.userId,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "plan_items",
          rowId: id,
          before: { estimatePaise: row.estimatePaise },
          after: { estimatePaise: input.estimatePaise, reason },
        }),
      ]);

      return {
        id,
        patientId: row.patientId,
        procedureLabel: row.procedureLabel,
        estimatePaise: input.estimatePaise,
        status: row.status,
        version: row.version + 1,
      };
    },
  };
}
