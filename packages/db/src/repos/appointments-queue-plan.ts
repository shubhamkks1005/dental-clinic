import {
  canReorder,
  orderDayQueue,
  QUEUE_STEP,
  type AppointmentPriority,
  type AppointmentStatus,
} from "@clinic/shared";
import { isNull, sql, and } from "drizzle-orm";
import type { Db } from "../client";
import { appointments } from "../schema";

/** The columns the queue rules need, for every live appointment of one day. */
export type QueueDayRow = {
  id: string;
  version: number;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  startAt: string;
  arrivedAt: string | null;
  queueOrder: number | null;
  steppedOutAt: string | null;
  skipCount: number;
  lateAt: string | null;
  patientId: string;
};

/**
 * One read: the day of the appointment `id`, for ITS doctor only (each doctor has their own queue,
 * owner 2026-11-26; index appointments_day_queue_idx). Skip, pull forward, step out and late swap
 * therefore never move another doctor's rows. Old rows with no doctor form one shared queue.
 */
export async function loadQueueDay(db: Db, id: string): Promise<QueueDayRow[]> {
  const rows = await db
    .select({
      id: appointments.id,
      version: appointments.version,
      status: appointments.status,
      priority: appointments.priority,
      startAt: appointments.startAt,
      arrivedAt: appointments.arrivedAt,
      queueOrder: appointments.queueOrder,
      steppedOutAt: appointments.steppedOutAt,
      skipCount: appointments.skipCount,
      lateAt: appointments.lateAt,
      patientId: appointments.patientId,
    })
    .from(appointments)
    .where(
      and(
        sql`${appointments.dateLocal} = (SELECT date_local FROM appointments WHERE id = ${id})`,
        sql`${appointments.doctorId} IS (SELECT doctor_id FROM appointments WHERE id = ${id})`,
        isNull(appointments.deletedAt),
      ),
    )
    .all();
  return rows as QueueDayRow[];
}

export type QueuePlan = {
  /** Rows in list order with every active row numbered. */
  ordered: QueueDayRow[];
  /** Rows that had no number yet and get one (a number only, no version change). */
  newNumbers: { id: string; queueOrder: number }[];
};

/**
 * Numbers the active rows that have none: after the highest saved number, in the same order the
 * list shows them. Rows that already have a number are never touched.
 */
export function planQueue(rows: readonly QueueDayRow[]): QueuePlan {
  const saved = rows
    .filter((r) => canReorder(r.status) && r.queueOrder !== null)
    .map((r) => r.queueOrder as number);
  let next = (saved.length > 0 ? Math.max(...saved) : 0) + QUEUE_STEP;
  const numbers = new Map<string, number>();
  for (const r of orderDayQueue(rows)) {
    if (canReorder(r.status) && r.queueOrder === null) {
      numbers.set(r.id, next);
      next += QUEUE_STEP;
    }
  }
  const filled = rows.map((r) =>
    numbers.has(r.id) ? { ...r, queueOrder: numbers.get(r.id)! } : r,
  );
  return {
    ordered: orderDayQueue(filled),
    newNumbers: [...numbers].map(([id, queueOrder]) => ({ id, queueOrder })),
  };
}

/** Largest saved queue number among the rows that can still be reordered. */
export function lastQueueOrder(ordered: readonly QueueDayRow[]): number {
  return ordered.reduce(
    (max, r) => (canReorder(r.status) && r.queueOrder !== null ? Math.max(max, r.queueOrder) : max),
    0,
  );
}
