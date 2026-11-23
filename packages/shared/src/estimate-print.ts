import { addIstDays, istDate } from "./time";

/** Days an estimate sheet stays valid unless the plan changes (4.4.1). */
export const ESTIMATE_VALID_DAYS = 30;

/**
 * DRAFT until lawyer confirms. Shown on every estimate print.
 * Marked clearly so staff know wording is not final.
 */
export const ESTIMATE_DISCLAIMER =
  "DRAFT - lawyer to confirm. This sheet is an estimate only, not a final bill. Fees may change if treatment needs change. Any increase will be explained before work continues.";

export function estimateValidUntil(from: Date = new Date()): string {
  return addIstDays(istDate(from), ESTIMATE_VALID_DAYS);
}

/** Integer fingerprint of plan rows for print_log.document_version. */
export function estimatePlanVersion(
  items: ReadonlyArray<{ version: number; estimatePaise: number }>,
): number {
  let sum = 0;
  for (const item of items) {
    sum += item.version * 1_000_000 + (item.estimatePaise % 1_000_000);
  }
  return Math.max(1, sum);
}
