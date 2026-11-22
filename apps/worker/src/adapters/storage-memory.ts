import type { StorageAdapter, StoredObject } from "./storage";

/** In-memory fake for unit tests. */
export function memoryStorage(): StorageAdapter & { keys(): string[] } {
  const map = new Map<string, { bytes: Uint8Array; contentType: string }>();
  return {
    async put(key, bytes, contentType) {
      map.set(key, { bytes: new Uint8Array(bytes), contentType });
    },
    async get(key): Promise<StoredObject | null> {
      const hit = map.get(key);
      if (!hit) return null;
      const copy = new Uint8Array(hit.bytes.byteLength);
      copy.set(hit.bytes);
      return {
        body: copy.buffer,
        contentType: hit.contentType,
        size: hit.bytes.byteLength,
      };
    },
    async delete(key) {
      map.delete(key);
    },
    keys: () => [...map.keys()],
  };
}
