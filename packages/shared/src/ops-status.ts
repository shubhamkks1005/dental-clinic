import { z } from "zod";

export const OPS_STATUS_KEYS = ["backup_d1", "backup_files", "backup_pc", "quota"] as const;
export const OPS_STATUS_VALUES = ["ok", "fail", "unknown"] as const;

/** Signed webhook body for POST /hooks/ops-status (9.1.10). No PHI. */
export const opsStatusHookBodySchema = z.object({
  key: z.enum(OPS_STATUS_KEYS),
  status: z.enum(OPS_STATUS_VALUES),
  checkedAt: z.string().min(10).max(40),
  detail: z
    .object({
      sizeBytes: z.number().int().nonnegative().optional(),
      file: z.string().max(120).optional(),
      sha256: z.string().max(64).optional(),
      note: z.string().max(200).optional(),
    })
    .optional()
    .default({}),
});

export type OpsStatusHookBody = z.infer<typeof opsStatusHookBodySchema>;

/** Stale if last ok check older than this many hours (backup nightly ~24h + grace). */
export const BACKUP_STALE_HOURS = 27;

export function backupAttentionLine(
  row: { status: string; checkedAt: string; detail?: { sizeBytes?: number; file?: string } } | null,
  nowMs: number = Date.now(),
): { tone: "ok" | "warn" | "bad"; text: string } {
  if (!row) {
    return { tone: "warn", text: "Last backup: not reported yet" };
  }
  const checked = Date.parse(row.checkedAt);
  const ageH = Number.isFinite(checked) ? (nowMs - checked) / 3_600_000 : Infinity;
  const size =
    typeof row.detail?.sizeBytes === "number"
      ? `, ${Math.round(row.detail.sizeBytes / (1024 * 1024))} MB`
      : "";
  if (row.status === "fail" || ageH > BACKUP_STALE_HOURS) {
    return {
      tone: "bad",
      text: `Last backup: ${row.status === "fail" ? "failed" : "stale"} (${Math.floor(ageH)} h ago${size})`,
    };
  }
  return {
    tone: "ok",
    text: `Last backup: ok ${Math.floor(ageH)} h ago${size}`,
  };
}
