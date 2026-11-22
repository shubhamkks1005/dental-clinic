import { describe, expect, it } from "vitest";
import { STORAGE_CRIT_BYTES, STORAGE_WARN_BYTES, storageAlertLevel } from "./storage-usage";

describe("storageAlertLevel (3.7.6)", () => {
  it("is ok under 7 GB, warn at 8 GB, crit at 9 GB+", () => {
    expect(storageAlertLevel(0)).toBe("ok");
    expect(storageAlertLevel(STORAGE_WARN_BYTES - 1)).toBe("ok");
    expect(storageAlertLevel(8 * 1024 * 1024 * 1024)).toBe("warn");
    expect(storageAlertLevel(STORAGE_CRIT_BYTES)).toBe("crit");
  });
});
