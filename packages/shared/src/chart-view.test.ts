import { describe, expect, it } from "vitest";
import {
  CHART_NOTATION_LABEL,
  DEFAULT_CHART_VIEW,
  chartViewSchema,
  toothDisplayLabel,
} from "./chart-view";

describe("chart.view (3.4.3)", () => {
  it("defaults to dentist facing and FDI", () => {
    expect(DEFAULT_CHART_VIEW).toEqual({ facing: "dentist", notation: "fdi" });
    expect(chartViewSchema.parse(DEFAULT_CHART_VIEW)).toEqual(DEFAULT_CHART_VIEW);
  });

  it("refuses unknown facing or notation", () => {
    expect(chartViewSchema.safeParse({ facing: "mirror", notation: "fdi" }).success).toBe(false);
    expect(chartViewSchema.safeParse({ facing: "dentist", notation: "iso" }).success).toBe(false);
  });

  it("maps FDI 46 to Universal 30 and Palmer LR6", () => {
    expect(toothDisplayLabel(46, "fdi")).toBe("46");
    expect(toothDisplayLabel(46, "universal")).toBe("30");
    expect(toothDisplayLabel(46, "palmer")).toBe("LR6");
  });

  it("maps primary FDI 55 to Universal A and Palmer URE (second molar)", () => {
    expect(toothDisplayLabel(55, "universal")).toBe("A");
    expect(toothDisplayLabel(55, "palmer")).toBe("URE");
    expect(toothDisplayLabel(51, "palmer")).toBe("URA");
  });

  it("always has a human name for the active notation", () => {
    expect(CHART_NOTATION_LABEL.fdi).toBe("FDI");
    expect(CHART_NOTATION_LABEL.universal).toBe("Universal");
    expect(CHART_NOTATION_LABEL.palmer).toBe("Palmer");
  });
});
