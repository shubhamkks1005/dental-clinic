import {
  QUEUE_STEP,
  canReorder,
  orderDayQueue,
  slotAboveForPull,
  swapTargetForSkip,
  type AppointmentStatus,
} from "@clinic/shared";
import type { DayAppointment } from "../../appointments/api";
import type { QueueAction } from "./doctor-api";

// What the list shows the moment the doctor confirms a move, before the server answers (speed
// rule 9: optimistic only for status and order). The rules are the shared ones the server uses
// (orderDayQueue, swapTargetForSkip, slotAboveForPull), so a reload gives the same order.
const OPEN: readonly AppointmentStatus[] = ["scheduled", "confirmed", "arrived"];

/** The order the server will save: every open row numbered 10, 20, 30 ... in list order. */
function numbered(rows: readonly DayAppointment[]): DayAppointment[] {
  const order = orderDayQueue(rows.map((r) => ({ ...r, queueOrder: r.queueOrder ?? null })));
  let n = 0;
  const numbers = new Map<string, number>();
  for (const r of order) if (canReorder(r.status)) numbers.set(r.id, (n += QUEUE_STEP));
  return rows.map((r) => (numbers.has(r.id) ? { ...r, queueOrder: numbers.get(r.id)! } : r));
}

export function applyMove(
  rows: readonly DayAppointment[],
  action: QueueAction,
  id: string,
  now: Date,
): DayAppointment[] {
  const nowIso = now.toISOString();
  const all = numbered(rows);
  const ordered = orderDayQueue(all.map((r) => ({ ...r, queueOrder: r.queueOrder ?? null })));
  const patch = (target: string, change: Partial<DayAppointment>) =>
    all.map((r) => (r.id === target ? { ...r, ...change } : r));
  const me = all.find((r) => r.id === id);
  if (!me) return [...rows];

  if (action === "skip" || action === "pull-forward") {
    const partner =
      action === "skip" ? swapTargetForSkip(ordered, id) : slotAboveForPull(ordered, id);
    const flag =
      action === "skip" ? { steppedOutAt: nowIso, skipCount: (me.skipCount ?? 0) + 1 } : {};
    if (!partner) return patch(id, flag);
    return all.map((r) => {
      if (r.id === id) return { ...r, ...flag, queueOrder: partner.queueOrder };
      if (r.id === partner.id) return { ...r, queueOrder: me.queueOrder };
      return r;
    });
  }
  if (action === "late") {
    const last = Math.max(
      0,
      ...all.filter((r) => r.id !== id && canReorder(r.status)).map((r) => r.queueOrder ?? 0),
    );
    return patch(id, { lateAt: nowIso, steppedOutAt: null, queueOrder: last + QUEUE_STEP });
  }
  if (action === "step-out") return patch(id, { steppedOutAt: nowIso });
  // step-back: the patient is here again (Not arrived becomes Arrived).
  const arrives = me.status === "scheduled" || me.status === "confirmed";
  return patch(id, {
    steppedOutAt: null,
    ...(arrives && OPEN.includes(me.status)
      ? { status: "arrived" as const, arrivedAt: nowIso }
      : {}),
  });
}
