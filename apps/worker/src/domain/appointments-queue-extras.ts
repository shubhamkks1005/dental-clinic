import type { Repos } from "@clinic/db";
import type { CurrentBreak, LastOrderChange } from "@clinic/shared";

type QueueRow = { queueChangedAt: string | null; queueChangedBy: string | null };

/**
 * What the doctor's Today needs besides the rows: who last changed the order, and the breaks that
 * are on now (already read together with the leave days, one round trip). At most one small read,
 * started together with the marks (S3.2.1).
 */
export async function loadQueueExtras(
  repos: Repos,
  rows: readonly QueueRow[],
  openBreaks: CurrentBreak[],
): Promise<{
  lastOrderChange: LastOrderChange | null;
  currentBreak: CurrentBreak | null;
  openBreaks: CurrentBreak[];
}> {
  let newest: QueueRow | null = null;
  for (const r of rows) {
    if (r.queueChangedAt && (!newest || r.queueChangedAt > (newest.queueChangedAt as string))) {
      newest = r;
    }
  }
  const byName = newest?.queueChangedBy
    ? await repos.appointments.queueChangerName(newest.queueChangedBy).catch(() => null)
    : null;
  return {
    lastOrderChange: newest?.queueChangedAt ? { byName, at: newest.queueChangedAt } : null,
    currentBreak: openBreaks[0] ?? null,
    openBreaks,
  };
}
