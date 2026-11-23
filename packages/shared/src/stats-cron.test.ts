import { describe, expect, it } from "vitest";
import { shouldRunNightlyStats } from "./stats-cron";

describe("shouldRunNightlyStats (6.2.3)", () => {
  it("true only in the first 5 IST minutes after midnight", () => {
    // 2026-11-22 18:30 UTC = 2026-11-23 00:00 IST
    expect(shouldRunNightlyStats(new Date("2026-11-22T18:30:00.000Z"))).toBe(true);
    expect(shouldRunNightlyStats(new Date("2026-11-22T18:34:00.000Z"))).toBe(true);
    expect(shouldRunNightlyStats(new Date("2026-11-22T18:35:00.000Z"))).toBe(false);
    // 17:00 IST
    expect(shouldRunNightlyStats(new Date("2026-11-23T11:30:00.000Z"))).toBe(false);
  });
});
