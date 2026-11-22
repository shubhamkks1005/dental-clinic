import { formatStorageGb, storageAlertLevel } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getStorageUsage } from "./api";

/** 3.7.6: show summed file bytes; yellow ≥7 GB, red ≥9 GB. */
export function StorageUsagePanel() {
  const [bytes, setBytes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStorageUsage()
      .then(setBytes)
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : "Could not load storage use.");
      });
  }, []);

  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (bytes === null) return <p className="muted">Loading storage…</p>;

  const level = storageAlertLevel(bytes);
  const className =
    level === "crit"
      ? "storage-panel is-crit"
      : level === "warn"
        ? "storage-panel is-warn"
        : "storage-panel";

  return (
    <div className={className} role="status">
      <strong>File storage</strong>
      <p>
        {formatStorageGb(bytes)} used of about 10 GB
        {level === "warn" ? " — getting full. Remove old scans if you can." : null}
        {level === "crit" ? " — almost full. Free space soon." : null}
      </p>
    </div>
  );
}
