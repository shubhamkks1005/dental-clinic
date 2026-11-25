import { newUlid } from "@clinic/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { planItems, visitProcedures } from "../schema";
import { nowUtcSql } from "../sql";

const OPEN_STATUSES = ["planned", "accepted", "in_progress", "deferred"] as const;

type BatchPiece = Parameters<Db["batch"]>[0][number];

/**
 * 3.6.4: on visit finalise, match procedures to plan items or create completed items.
 * Returns statements for the same db.batch as finalise.
 */
export async function planSyncStatementsForFinalise(
  db: Db,
  ctx: Ctx,
  opts: { visitId: string; patientId: string },
): Promise<BatchPiece[]> {
  const procedures = await db
    .select()
    .from(visitProcedures)
    .where(and(eq(visitProcedures.visitId, opts.visitId), isNull(visitProcedures.deletedAt)))
    .all();
  if (procedures.length === 0) return [];

  const open = await db
    .select()
    .from(planItems)
    .where(
      and(
        eq(planItems.patientId, opts.patientId),
        isNull(planItems.deletedAt),
        inArray(planItems.status, [...OPEN_STATUSES]),
      ),
    )
    .all();

  const used = new Set<string>();
  const batch: BatchPiece[] = [];

  for (const proc of procedures) {
    const match = open.find((item) => {
      if (used.has(item.id)) return false;
      const toothOk =
        (item.toothFdi == null && proc.toothFdi == null) || item.toothFdi === proc.toothFdi;
      if (!toothOk) return false;
      if (item.listItemId && proc.listItemId && item.listItemId === proc.listItemId) return true;
      return item.procedureLabel === proc.label;
    });

    // The doctor chose per procedure line: finished (default) or "needs more sittings". Either way
    // this visit counts as one sitting on the matching plan item.
    if (match) {
      used.add(match.id);
      const more = proc.moreSittings;
      const done = match.sittingsDone + 1;
      batch.push(
        db
          .update(planItems)
          .set({
            status: more ? "in_progress" : "completed",
            sittingsDone: done,
            ...(more ? {} : { completedVisitId: opts.visitId }),
            version: match.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(planItems.id, match.id), eq(planItems.version, match.version))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "plan_items",
          rowId: match.id,
          before: { status: match.status, sittingsDone: match.sittingsDone },
          after: more
            ? { status: "in_progress", sittingsDone: done }
            : { status: "completed", sittingsDone: done, completedVisitId: opts.visitId },
        }),
      );
    } else {
      const id = newUlid();
      batch.push(
        db.insert(planItems).values({
          id,
          patientId: opts.patientId,
          toothFdi: proc.toothFdi,
          listItemId: proc.listItemId,
          procedureLabel: proc.label,
          estimatePaise: proc.defaultPaise ?? 0,
          phase: 1,
          sittings: proc.moreSittings ? 2 : 1,
          sittingsDone: 1,
          status: proc.moreSittings ? "in_progress" : "completed",
          createdVisitId: opts.visitId,
          ...(proc.moreSittings ? {} : { completedVisitId: opts.visitId }),
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "plan_items",
          rowId: id,
          after: {
            patientId: opts.patientId,
            procedureLabel: proc.label,
            status: proc.moreSittings ? "in_progress" : "completed",
            fromVisit: opts.visitId,
          },
        }),
      );
    }
  }

  return batch;
}
