import { describe, expect, it } from "vitest";
import { chartPointLabel, moveChartFocus } from "./chart-keys";

describe("chart-keys (6.3.2)", () => {
  it("moves focus with arrows and jumps with Home/End", () => {
    expect(moveChartFocus(0, "ArrowRight", 5)).toBe(1);
    expect(moveChartFocus(4, "ArrowRight", 5)).toBe(4);
    expect(moveChartFocus(2, "Home", 5)).toBe(0);
    expect(moveChartFocus(2, "End", 5)).toBe(4);
  });

  it("builds a spoken label with the value (not colour alone)", () => {
    expect(chartPointLabel("Monday", 12, "patients")).toBe("Monday: 12 patients");
  });
});
