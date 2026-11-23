import { describe, expect, it } from "vitest";
import { daysBetweenOn, dueAgeBucket, parseDuesCall } from "./dues";

describe("dueAgeBucket (5.3.4)", () => {
  it("splits 0-30 / 31-60 / 61+", () => {
    expect(dueAgeBucket(0)).toBe("0-30");
    expect(dueAgeBucket(30)).toBe("0-30");
    expect(dueAgeBucket(31)).toBe("31-60");
    expect(dueAgeBucket(60)).toBe("31-60");
    expect(dueAgeBucket(61)).toBe("61+");
    expect(dueAgeBucket(200)).toBe("61+");
  });
});

describe("daysBetweenOn", () => {
  it("counts whole days", () => {
    expect(daysBetweenOn("2026-11-01", "2026-11-01")).toBe(0);
    expect(daysBetweenOn("2026-11-01", "2026-11-23")).toBe(22);
    expect(daysBetweenOn("2026-10-01", "2026-12-01")).toBe(61);
  });
});

describe("parseDuesCall", () => {
  it("requires a note", () => {
    expect(parseDuesCall({ note: "" }).ok).toBe(false);
    expect(parseDuesCall({ note: "Called, will pay Friday" }).ok).toBe(true);
  });
});
