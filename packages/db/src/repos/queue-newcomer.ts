import { QUEUE_STEP, tunableDefault } from "@clinic/shared";
import { sql } from "drizzle-orm";
import type { Db } from "../client";
import { intSetting } from "./int-setting";

/**
 * Where a row that just arrived goes in ITS doctor's saved order (each doctor has their own queue,
 * owner 2026-11-26). When that doctor has not reordered the day (no queue numbers) this is NULL and
 * the arrival-time rule applies; otherwise the row goes to the back (highest number + one step).
 * A row that already has a number keeps it. Rows with no doctor share one old queue.
 */
export function newcomerQueueOrder(dateLocal: string, doctorId: string | null) {
  return sql`(SELECT CASE WHEN count(queue_order) > 0 THEN max(queue_order) + ${QUEUE_STEP} END FROM appointments WHERE doctor_id IS ${doctorId} AND date_local = ${dateLocal} AND deleted_at IS NULL)`;
}

export const keepOrElseNewcomer = (dateLocal: string, doctorId: string | null) =>
  sql`COALESCE(queue_order, ${newcomerQueueOrder(dateLocal, doctorId)})`;

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
