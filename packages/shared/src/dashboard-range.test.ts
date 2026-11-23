import { describe, expect, it } from "vitest";
import { parseDashboardRange } from "./dashboard-range";

const NOW = new Date("2026-11-23T06:30:00.000Z"); // 23 Nov 2026 IST noon-ish

describe("parseDashboardRange (6.3.1)", () => {
  it("defaults to this_month through today", () => {
    const r = parseDashboardRange({}, NOW);
    expect(r).toMatchObject({
      ok: true,
      range: { preset: "this_month", from: "2026-11-01", to: "2026-11-23", grain: "day" },
    });
  });

  it("resolves each preset to the right IST dates", () => {
    expect(parseDashboardRange({ range: "today" }, NOW)).toMatchObject({
      ok: true,
      range: { from: "2026-11-23", to: "2026-11-23", grain: "day" },
    });
    expect(parseDashboardRange({ range: "7d" }, NOW)).toMatchObject({
      ok: true,
      range: { from: "2026-11-17", to: "2026-11-23", grain: "day" },
    });
    expect(parseDashboardRange({ range: "last_month" }, NOW)).toMatchObject({
      ok: true,
      range: { from: "2026-10-01", to: "2026-10-31", grain: "day" },
    });
    expect(parseDashboardRange({ range: "12m" }, NOW)).toMatchObject({
      ok: true,
      range: { from: "2025-12-01", to: "2026-11-23", grain: "month" },
    });
  });

  it("adds a previous equal-length compare window", () => {
    const r = parseDashboardRange({ range: "7d", compare: "1" }, NOW);
    expect(r.ok && r.range).toMatchObject({
      from: "2026-11-17",
      to: "2026-11-23",
      compareFrom: "2026-11-10",
      compareTo: "2026-11-16",
    });
  });

  it("rejects bad custom and unknown presets", () => {
    expect(parseDashboardRange({ range: "custom", from: "x", to: "y" }, NOW)).toMatchObject({
      ok: false,
    });
    expect(
      parseDashboardRange({ range: "custom", from: "2026-11-20", to: "2026-11-10" }, NOW),
    ).toMatchObject({ ok: false });
    expect(parseDashboardRange({ range: "week" }, NOW)).toMatchObject({ ok: false });
  });
});
