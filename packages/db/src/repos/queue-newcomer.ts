import { QUEUE_STEP, tunableDefault } from "@clinic/shared";
import { sql } from "drizzle-orm";
import type { Db } from "../client";
import { intSetting } from "./int-setting";

/**
 * Where a row that just arrived goes in the doctor's saved order. When nobody has reordered the
 * day (no queue numbers) this is NULL and the old arrival-time rule applies; otherwise the row
 * goes to the back (highest number + one step). A row that already has a number keeps it.
 */
export function newcomerQueueOrder(dateLocal: string) {
  return sql`(SELECT CASE WHEN count(queue_order) > 0 THEN max(queue_order) + ${QUEUE_STEP} END FROM appointments WHERE date_local = ${dateLocal} AND deleted_at IS NULL)`;
}

export const keepOrElseNewcomer = (dateLocal: string) =>
  sql`COALESCE(queue_order, ${newcomerQueueOrder(dateLocal)})`;

export function lateAfterMinutes(db: Db): Promise<number> {
  return intSetting(
    db,
    "appointments.late_after_minutes",
    tunableDefault("appointments.late_after_minutes"),
  );
}

/** The late mark for someone who arrives more than `limitMinutes` after their start time. */
export function lateAtFor(startAtIso: string, now: Date, limitMinutes: number): string | null {
  const lateByMs = now.getTime() - new Date(startAtIso).getTime();
  return lateByMs > limitMinutes * 60_000 ? now.toISOString() : null;
}
