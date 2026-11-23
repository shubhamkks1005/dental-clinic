import { tunableDefault } from "./tunables";

/** 3.7.6 / 6.5.3: alert levels from summed files.bytes (thresholds from TUNABLES / settings). */
export const STORAGE_WARN_BYTES = tunableDefault("files.storage_warn_gb") * 1024 * 1024 * 1024;
export const STORAGE_CRIT_BYTES = tunableDefault("files.storage_crit_gb") * 1024 * 1024 * 1024;
export const STORAGE_CAP_BYTES = 10 * 1024 * 1024 * 1024;

export type StorageAlertLevel = "ok" | "warn" | "crit";

export function storageAlertLevel(
  bytes: number,
  warnGb = tunableDefault("files.storage_warn_gb"),
  critGb = tunableDefault("files.storage_crit_gb"),
): StorageAlertLevel {
  const warn = warnGb * 1024 * 1024 * 1024;
  const crit = critGb * 1024 * 1024 * 1024;
  if (bytes >= crit) return "crit";
  if (bytes >= warn) return "warn";
  return "ok";
}

export function formatStorageGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
