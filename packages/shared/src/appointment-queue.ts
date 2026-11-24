import { formatDuration } from "./format";
import type { AppointmentPriority, AppointmentStatus } from "./appointments";

export type QueueRow = {
  id: string;
  priority: AppointmentPriority;
  arrivedAt: string | null;
  createdAt: string;
};

/**
 * Waiting queue order (2.3.7): emergencies first (red tag), then by arrival time,
 * then by created_at so same-minute walk-ins stay stable.
 */
export function compareWaitingQueue(a: QueueRow, b: QueueRow): number {
  const ae = a.priority === "emergency" ? 0 : 1;
  const be = b.priority === "emergency" ? 0 : 1;
  if (ae !== be) return ae - be;
  const aArr = a.arrivedAt ?? a.createdAt;
  const bArr = b.arrivedAt ?? b.createdAt;
  if (aArr !== bArr) return aArr < bArr ? -1 : 1;
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

export function sortWaitingQueue<T extends QueueRow>(rows: T[]): T[] {
  return [...rows].sort(compareWaitingQueue);
}

/** Whole minutes waiting since arrived_at (floor). Null if not arrived. */
export function waitingMinutes(arrivedAt: string | null, now: Date): number | null {
  if (!arrivedAt) return null;
  const ms = now.getTime() - new Date(arrivedAt).getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 60_000);
}

export function formatWaiting(arrivedAt: string | null, now: Date): string | null {
  const m = waitingMinutes(arrivedAt, now);
  if (m === null) return null;
  if (m < 1) return "Waiting under 1 min";
  return `Waiting ${formatDuration(m)}`;
}

// ---- Doctor's day queue (Part T): one saved order for the whole day ----

/** Gap between saved queue_order values, so one row can move without renumbering the rest. */
export const QUEUE_STEP = 10;

/** Statuses a row may be moved (skip, pull forward) in. */
const REORDERABLE: readonly AppointmentStatus[] = ["scheduled", "confirmed", "arrived"];

export function canReorder(status: AppointmentStatus): boolean {
  return REORDERABLE.includes(status);
}

export type DayQueueRow = {
  id: string;
  status: AppointmentStatus;
  priority?: AppointmentPriority;
  queueOrder: number | null;
  arrivedAt: string | null;
  startAt: string;
};

function byStart(a: DayQueueRow, b: DayQueueRow): number {
  if (a.startAt !== b.startAt) return a.startAt < b.startAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Rows nobody has reordered: arrived first (emergency, then arrival time), then by start time.
function byArrivalThenStart(a: DayQueueRow, b: DayQueueRow): number {
  const aArr = a.arrivedAt !== null ? 0 : 1;
  const bArr = b.arrivedAt !== null ? 0 : 1;
  if (aArr !== bArr) return aArr - bArr;
  if (aArr === 0) {
    const ae = a.priority === "emergency" ? 0 : 1;
    const be = b.priority === "emergency" ? 0 : 1;
    if (ae !== be) return ae - be;
    if (a.arrivedAt !== b.arrivedAt) return (a.arrivedAt ?? "") < (b.arrivedAt ?? "") ? -1 : 1;
  }
  return byStart(a, b);
}

/**
 * The doctor's list for one day: in chair first, then active rows by saved queue_order
 * (smaller first; rows without one after them), done rows at the bottom. Cancelled, missed
 * and moved rows are not in this list (they belong to the call list).
 */
export function orderDayQueue<T extends DayQueueRow>(rows: readonly T[]): T[] {
  const chair = rows.filter((r) => r.status === "in_chair").sort(byStart);
  const done = rows.filter((r) => r.status === "completed").sort(byStart);
  const active = rows.filter((r) => canReorder(r.status));
  const saved = active
    .filter((r) => r.queueOrder !== null)
    .sort((a, b) => (a.queueOrder as number) - (b.queueOrder as number) || byStart(a, b));
  const unsaved = active.filter((r) => r.queueOrder === null).sort(byArrivalThenStart);
  return [...chair, ...saved, ...unsaved, ...done];
}

/** The next row that is still to be seen (not done, not cancelled): the Skip swap partner. */
export function swapTargetForSkip<T extends DayQueueRow>(
  ordered: readonly T[],
  id: string,
): T | null {
  const at = ordered.findIndex((r) => r.id === id);
  if (at < 0) return null;
  return ordered.slice(at + 1).find((r) => canReorder(r.status)) ?? null;
}

/** The row one slot above that Pull forward swaps with, or null when already first. */
export function slotAboveForPull<T extends DayQueueRow>(
  ordered: readonly T[],
  id: string,
): T | null {
  const at = ordered.findIndex((r) => r.id === id);
  if (at <= 0) return null;
  for (let i = at - 1; i >= 0; i--) {
    const row = ordered[i] as T;
    if (canReorder(row.status)) return row;
  }
  return null;
}
