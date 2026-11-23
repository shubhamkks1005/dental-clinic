import { describe, expect, it } from "vitest";
import { growthNote, growthView } from "./growth";

describe("growth (6.3.5)", () => {
  it("marks small bases as thin data instead of a loud %", () => {
    const v = growthView(12, 8);
    expect(v.kind).toBe("thin");
    expect(growthNote(v, "patients")).toContain("Thin data");
  });

  it("shows delta and % when both sides have enough events", () => {
    const v = growthView(30, 25);
    expect(v).toMatchObject({ kind: "up", delta: 5, percent: 20 });
    expect(growthNote(v)).toContain("+5");
    expect(growthNote(v)).toContain("20%");
  });
});
