import { describe, expect, it } from "vitest";
import { AUTO_REFRESH_MS, shouldPollWhenVisible } from "./visible-interval";

describe("visible interval (2.4.7)", () => {
  it("uses a 60 second poll and only while visible", () => {
    expect(AUTO_REFRESH_MS).toBe(60_000);
    expect(shouldPollWhenVisible("visible")).toBe(true);
    expect(shouldPollWhenVisible("hidden")).toBe(false);
  });
});
