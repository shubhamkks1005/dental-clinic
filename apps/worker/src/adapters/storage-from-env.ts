import type { Bindings } from "../types";
import { localStorage } from "./storage-local";
import { memoryStorage } from "./storage-memory";
import type { StorageAdapter } from "./storage";
import { StorageNotConfiguredError } from "./storage";
import { requireS3Config, s3Storage } from "./storage-s3";

type StorageEnv = Pick<
  Bindings,
  | "STORAGE_DRIVER"
  | "S3_ENDPOINT"
  | "S3_BUCKET"
  | "S3_REGION"
  | "S3_KEY_ID"
  | "S3_APP_KEY"
  | "FILES"
> & { __testStorage?: StorageAdapter };

/** Build the storage adapter from Worker env. Tests may set `__testStorage`. */
export function storageFromEnv(env: StorageEnv): StorageAdapter {
  if (env.__testStorage) return env.__testStorage;

  const driver = (env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  if (driver === "memory") return memoryStorage();
  if (driver === "s3") {
    return s3Storage(
      requireS3Config({
        endpoint: env.S3_ENDPOINT,
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        keyId: env.S3_KEY_ID,
        appKey: env.S3_APP_KEY,
      }),
    );
  }
  if (driver === "local") return localStorage(env.FILES);
  throw new StorageNotConfiguredError();
}
