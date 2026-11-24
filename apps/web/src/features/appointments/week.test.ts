import { describe, expect, it } from "vitest";
import { weekDays, weekStart } from "./useWeek";

describe("weekStart", () => {
  it("is the Monday of the week, Sunday belongs to the week before it ends", () => {
    expect(weekStart("2026-11-25")).toBe("2026-11-23");
    expect(weekStart("2026-11-23")).toBe("2026-11-23");
    expect(weekStart("2026-11-29")).toBe("2026-11-23");
    expect(weekDays("2026-11-25")).toHaveLength(7);
  });
});
