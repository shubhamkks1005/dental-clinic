import type { AppointmentStatus } from "@clinic/shared";
import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError } from "../errors";
import { appointments } from "../schema";
import type { QueueDayRow, QueuePlan } from "./appointments-queue-plan";

export const STALE = "The list changed. Reload and try again.";
export type BatchItems = Parameters<Db["batch"]>[0];

export type QueueMoveResult = {
  id: string;
  version: number;
  status: AppointmentStatus;
  queueOrder: number | null;
  steppedOutAt: string | null;
  skipCount: number;
  lateAt: string | null;
  /** The row that swapped places with it, if any (its new version, so the screen can update). */
  other: { id: string; version: number; queueOrder: number } | null;
};

export type QueueChange = Partial<{
  queueOrder: number;
  steppedOutAt: string | null;
  skipCount: number;
  lateAt: string;
  status: AppointmentStatus;
  arrivedAt: string;
}>;

const view = (r: QueueDayRow, c: QueueChange = {}) => ({
  queueOrder: c.queueOrder ?? r.queueOrder,
  steppedOutAt: c.steppedOutAt === undefined ? r.steppedOutAt : c.steppedOutAt,
  skipCount: c.skipCount ?? r.skipCount,
  lateAt: c.lateAt ?? r.lateAt,
  status: c.status ?? r.status,
});

/** The statements the queue moves are built from. Each move sends them as ONE db.batch. */
export function queueWriter(db: Db, ctx: Ctx) {
  // The UPDATE of one row (plus its audit row), guarded by the version and the queue number we read.
  function update(
    row: QueueDayRow,
    expectedVersion: number,
    expectedOrder: number | null,
    change: QueueChange,
    nowIso: string,
    also?: SQL,
  ) {
    return [
      db
        .update(appointments)
        .set({
          version: sql`${appointments.version} + 1`,
          updatedBy: ctx.userId,
          updatedAt: nowIso,
          queueChangedAt: nowIso,
          queueChangedBy: ctx.userId,
          ...change,
        })
        .where(
          and(
            eq(appointments.id, row.id),
            eq(appointments.version, expectedVersion),
            sql`${appointments.queueOrder} IS ${expectedOrder}`,
            isNull(appointments.deletedAt),
            also,
          ),
        ),
      auditInsertIfChanged(db, ctx, {
        action: "update",
        table: "appointments",
        rowId: row.id,
        before: { ...view(row), version: row.version },
        after: { ...view(row, change), version: expectedVersion + 1 },
      }),
    ];
  }

  // Numbers for rows that have none yet. No version change, no audit: nobody sees these numbers.
  const numberStatements = (plan: QueuePlan) =>
    plan.newNumbers.map((n) =>
      db
        .update(appointments)
        .set({ queueOrder: n.queueOrder })
        .where(
          and(
            eq(appointments.id, n.id),
            isNull(appointments.queueOrder),
            isNull(appointments.deletedAt),
          ),
        ),
    );

  // "The other row is still as we read it": makes a two-row swap all-or-nothing in one batch.
  const unchanged = (alias: "nb" | "tg", id: string, version: number, order: number | null) => {
    const a = sql.raw(alias);
    return sql`EXISTS (SELECT 1 FROM appointments AS ${a} WHERE ${a}.id = ${id} AND ${a}.version = ${version} AND ${a}.queue_order IS ${order} AND ${a}.deleted_at IS NULL)`;
  };

  async function result(id: string, version: number, other: QueueMoveResult["other"]) {
    const next = await db
      .select({
        id: appointments.id,
        version: appointments.version,
        status: appointments.status,
        queueOrder: appointments.queueOrder,
        steppedOutAt: appointments.steppedOutAt,
        skipCount: appointments.skipCount,
        lateAt: appointments.lateAt,
      })
      .from(appointments)
      .where(eq(appointments.id, id))
      .get();
    if (!next || next.version !== version + 1) throw new ConflictError(STALE);
    return { ...next, status: next.status as AppointmentStatus, other } satisfies QueueMoveResult;
  }

  return { update, numberStatements, unchanged, result };
}
