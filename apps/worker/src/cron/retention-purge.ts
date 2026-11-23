import { writeLog } from "../log";
import type { Bindings } from "../types";

/** Max rows deleted per table per tick (Worker CPU). */
export const PURGE_ROW_LIMIT = 200;

/**
 * 9.3.10: soft-delete aged operational rows. Clinical/money/audit never purged here.
 * Row-limited. Legal hold = Waiting.
 */
export async function runRetentionPurge(env: Bindings, now: Date): Promise<{ deleted: number }> {
  const nowIso = now.toISOString();
  let deleted = 0;

  // D1 has no UPDATE ... LIMIT, so pick ids in a subquery. Cutoff is ISO so it compares with created_at text.
  const cutoff = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const r = await env.DB.prepare(
    `UPDATE message_attempts SET deleted_at = ?1, updated_at = ?1, updated_by = 'system'
     WHERE id IN (
       SELECT id FROM message_attempts
       WHERE deleted_at IS NULL AND created_at < ?2
       LIMIT ${PURGE_ROW_LIMIT}
     )`,
  )
    .bind(nowIso, cutoff)
    .run();
  deleted += Number(r.meta?.changes ?? 0);

  writeLog("info", { msg: "cron_retention_purge", deleted });
  return { deleted };
}
