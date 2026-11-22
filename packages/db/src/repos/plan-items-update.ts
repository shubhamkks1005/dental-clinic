import type { ChangeEstimateInput, SetPlanDecisionInput } from "@clinic/shared";
import { newUlid } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { planItems, planItemVersions } from "../schema";
import { nowUtcSql } from "../sql";
import type { PlanItemRow } from "./plan-items-types";

/** 3.2.5 / 3.6.5: raising the estimate needs a reason; old value goes to versions. */
export async function changeEstimate(
  db: Db,
  ctx: Ctx,
  id: string,
  input: ChangeEstimateInput,
): Promise<PlanItemRow> {
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
}

/** 3.6.2: patient decision; accepted requires toldOn (fees told before treatment). */
export async function setDecision(
  db: Db,
  ctx: Ctx,
  id: string,
  input: SetPlanDecisionInput,
): Promise<PlanItemRow> {
  assertAllowed(ctx, "clinical.edit");
  const row = await db
    .select()
    .from(planItems)
    .where(and(eq(planItems.id, id), isNull(planItems.deletedAt)))
    .get();
  if (!row) throw new NotFoundError("That plan item");
  if (row.version !== input.version) throw new ConflictError();

  const toldOn = input.toldOn ?? row.toldOn;
  if (input.status === "accepted" && !toldOn) {
    throw new InvalidError(
      "Record the date you told the patient the estimate before marking accepted.",
    );
  }

  await db.batch([
    db
      .update(planItems)
      .set({
        status: input.status,
        toldOn: toldOn ?? null,
        version: row.version + 1,
        updatedAt: nowUtcSql,
        updatedBy: ctx.userId,
      })
      .where(and(eq(planItems.id, id), eq(planItems.version, input.version))),
    auditInsertIfChanged(db, ctx, {
      action: "update",
      table: "plan_items",
      rowId: id,
      before: { status: row.status, toldOn: row.toldOn },
      after: { status: input.status, toldOn: toldOn ?? null },
    }),
  ]);

  return {
    id,
    patientId: row.patientId,
    procedureLabel: row.procedureLabel,
    estimatePaise: row.estimatePaise,
    status: input.status,
    version: row.version + 1,
  };
}
