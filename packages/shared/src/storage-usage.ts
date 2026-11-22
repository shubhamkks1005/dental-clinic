/** 3.7.6: alert levels from summed files.bytes (not the bucket API). */
export const STORAGE_WARN_BYTES = 7 * 1024 * 1024 * 1024;
export const STORAGE_CRIT_BYTES = 9 * 1024 * 1024 * 1024;
export const STORAGE_CAP_BYTES = 10 * 1024 * 1024 * 1024;

export type StorageAlertLevel = "ok" | "warn" | "crit";

export function storageAlertLevel(bytes: number): StorageAlertLevel {
  if (bytes >= STORAGE_CRIT_BYTES) return "crit";
  if (bytes >= STORAGE_WARN_BYTES) return "warn";
  return "ok";
}

export function formatStorageGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
