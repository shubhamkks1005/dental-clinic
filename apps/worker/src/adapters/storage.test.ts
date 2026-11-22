import { describe, expect, it } from "vitest";
import { memoryStorage } from "./storage-memory";
import { StorageNotConfiguredError } from "./storage";
import { storageFromEnv } from "./storage-from-env";
import { requireS3Config } from "./storage-s3";

describe("storage adapters (3.7.2)", () => {
  it("memory put/get/delete round-trip", async () => {
    const s = memoryStorage();
    const bytes = new TextEncoder().encode("fake-xray");
    await s.put("f/test1", bytes, "image/jpeg");
    const got = await s.get("f/test1");
    expect(got?.size).toBe(bytes.byteLength);
    expect(got?.contentType).toBe("image/jpeg");
    await s.delete("f/test1");
    expect(await s.get("f/test1")).toBeNull();
  });

  it("s3 config missing throws clean error", () => {
    expect(() =>
      requireS3Config({ endpoint: "", bucket: "", region: "", keyId: "", appKey: "" }),
    ).toThrow(StorageNotConfiguredError);
  });

  it("storageFromEnv uses __testStorage when set", async () => {
    const mem = memoryStorage();
    const adapter = storageFromEnv({
      STORAGE_DRIVER: "s3",
      __testStorage: mem,
    } as never);
    await adapter.put("k", new Uint8Array([1]), "image/png");
    expect(mem.keys()).toEqual(["k"]);
  });
});
