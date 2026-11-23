import { describe, expect, it } from "vitest";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  historyTypesForChip,
  parseHistoryFeedQuery,
  resolveHistoryFeedFilters,
} from "./history-feed";

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

describe("history feed filters (6.7.1)", () => {
  it("maps chips to entry types", () => {
    expect(historyTypesForChip("all")).toBeNull();
    expect(historyTypesForChip("visits")).toEqual(["visit"]);
    expect(historyTypesForChip("bills")).toEqual(["bill", "payment", "refund"]);
  });

  it("resolves IST date bounds and tooth", () => {
    const f = resolveHistoryFeedFilters({
      from: "2026-11-01",
      to: "2026-11-01",
      tooth: 36,
    });
    expect(f.fromAt).toBe("2026-10-31T18:30:00.000Z");
    expect(f.toAtExclusive).toBe("2026-11-01T18:30:00.000Z");
    expect(f.tooth).toBe(36);
    expect(f.types).toEqual(["visit", "treatment", "file"]);
  });

  it("narrows types when text search is set", () => {
    const f = resolveHistoryFeedFilters({ chip: "all", q: "Crown" });
    expect(f.q).toBe("crown");
    expect(f.types).toEqual(["visit", "treatment"]);
  });

  it("rejects bad tooth and inverted dates", () => {
    expect(parseHistoryFeedQuery({ tooth: 99 }).ok).toBe(false);
    expect(parseHistoryFeedQuery({ from: "2026-12-01", to: "2026-11-01" }).ok).toBe(false);
  });
});
