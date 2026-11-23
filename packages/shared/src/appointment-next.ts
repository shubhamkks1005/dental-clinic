import { istDate, istMinutes } from "./time";

/** Only a booking that has not started can be "next". Arrived and in-chair ones are happening now. */
export const NEXT_APPOINTMENT_STATUSES = ["scheduled", "confirmed"] as const;

/** Q1.8: the one rule for "next appointment" (profile Overview and History strip). */
export function pickNextAppointment<
  T extends { status: string; dateLocal: string; startMin: number },
>(rows: T[], now: Date): T | null {
  const today = istDate(now);
  const minNow = istMinutes(now);
  const future = rows.filter(
    (r) =>
      (NEXT_APPOINTMENT_STATUSES as readonly string[]).includes(r.status) &&
      (r.dateLocal > today || (r.dateLocal === today && r.startMin > minNow)),
  );
  future.sort((a, b) => a.dateLocal.localeCompare(b.dateLocal) || a.startMin - b.startMin);
  return future[0] ?? null;
}
