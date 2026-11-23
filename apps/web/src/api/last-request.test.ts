import { describe, expect, it } from "vitest";
import { lastRequestId, recordRequestId } from "./last-request";

describe("last Error ID (for bug reports)", () => {
  it("keeps the newest ID and ignores empty ones", () => {
    expect(lastRequestId()).toBeNull();
    recordRequestId("AAAA1111");
    recordRequestId(null);
    expect(lastRequestId()).toBe("AAAA1111");
    recordRequestId("BBBB2222");
    expect(lastRequestId()).toBe("BBBB2222");
  });
});
