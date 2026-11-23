import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { patients } from "../schema";

/** Batch statements: set first_arrived_on once when still null (same batch as arrived stamp). */
export function markFirstArrivedBatch(
  db: Db,
  ctx: Ctx,
  patientId: string,
  dayLocal: string,
  nowIso: string,
) {
  return [
    db
      .update(patients)
      .set({
        firstArrivedOn: dayLocal,
        version: sql`${patients.version} + 1`,
        updatedBy: ctx.userId,
        updatedAt: nowIso,
      })
      .where(
        and(
          eq(patients.id, patientId),
          isNull(patients.firstArrivedOn),
          isNull(patients.deletedAt),
        ),
      ),
    auditInsertIfChanged(db, ctx, {
      action: "update",
      table: "patients",
      rowId: patientId,
      before: { firstArrivedOn: null },
      after: { firstArrivedOn: dayLocal },
    }),
  ] as const;
}
