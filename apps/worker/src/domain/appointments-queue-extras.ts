import type { Repos } from "@clinic/db";
import type { CurrentBreak, LastOrderChange } from "@clinic/shared";

type QueueRow = { queueChangedAt: string | null; queueChangedBy: string | null };

/**
 * What the doctor's Today needs besides the rows: who last changed the order, and the break that
 * is on now. Each is at most one small read, started together with the marks (S3.2.1).
 */
export async function loadQueueExtras(
  repos: Repos,
  rows: readonly QueueRow[],
  includeBreak: boolean,
  dateLocal: string,
): Promise<{ lastOrderChange: LastOrderChange | null; currentBreak: CurrentBreak | null }> {
  let newest: QueueRow | null = null;
  for (const r of rows) {
    if (r.queueChangedAt && (!newest || r.queueChangedAt > (newest.queueChangedAt as string))) {
      newest = r;
    }
  }
  const [byName, currentBreak] = await Promise.all([
    newest?.queueChangedBy
      ? repos.appointments.queueChangerName(newest.queueChangedBy).catch(() => null)
      : Promise.resolve(null),
    includeBreak ? repos.breaks.currentBreak(dateLocal).catch(() => null) : Promise.resolve(null),
  ]);
  return {
    lastOrderChange: newest?.queueChangedAt ? { byName, at: newest.queueChangedAt } : null,
    currentBreak,
  };
}
