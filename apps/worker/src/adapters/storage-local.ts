import type { StorageAdapter, StoredObject } from "./storage";
import { StorageNotConfiguredError } from "./storage";

/** Local/dev: Cloudflare R2 binding named FILES. */
export function localStorage(bucket: R2Bucket | undefined): StorageAdapter {
  if (!bucket) throw new StorageNotConfiguredError();
  return {
    async put(key, bytes, contentType) {
      await bucket.put(key, bytes, { httpMetadata: { contentType } });
    },
    async get(key): Promise<StoredObject | null> {
      const obj = await bucket.get(key);
      if (!obj) return null;
      return {
        body: obj.body,
        contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
        size: obj.size,
      };
    },
    async delete(key) {
      await bucket.delete(key);
    },
  };
}
