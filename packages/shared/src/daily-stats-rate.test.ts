import { describe, expect, it } from "vitest";
import { noShowPercent } from "./daily-stats-rate";

describe("noShowPercent (6.2.5)", () => {
  it("returns null when both sides are zero", () => {
    expect(noShowPercent([])).toBeNull();
  });

  it("divides noshow by arrived+noshow", () => {
    expect(
      noShowPercent([
        { metric: "noshow_count", dim: "", value: 1 },
        { metric: "noshow_arrived", dim: "", value: 3 },
      ]),
    ).toBeCloseTo(0.25, 5);
  });
});
