import { formatDuration } from "./format";
import type { AppointmentPriority } from "./appointments";

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
