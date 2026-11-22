import { describe, expect, it } from "vitest";
import { decodeHistoryCursor, encodeHistoryCursor, parseHistoryFeedQuery } from "./history-feed";

describe("history feed cursor (3.5.12)", () => {
  it("round-trips a cursor", () => {
    const raw = encodeHistoryCursor({ at: "2026-11-22T10:00:00.000Z", id: "01ABC" });
    expect(decodeHistoryCursor(raw)).toEqual({ at: "2026-11-22T10:00:00.000Z", id: "01ABC" });
  });

  it("rejects a bad cursor", () => {
    expect(decodeHistoryCursor("not-valid")).toBeNull();
    expect(decodeHistoryCursor("")).toBeNull();
  });

  it("parses feed query", () => {
    expect(parseHistoryFeedQuery({ limit: "30" }).ok).toBe(true);
    expect(parseHistoryFeedQuery({ limit: 99 }).ok).toBe(false);
  });
});
