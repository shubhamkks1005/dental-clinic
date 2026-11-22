import { describe, expect, it } from "vitest";
import { initialFocus, moveFocus } from "./chart-keyboard";
import { PERMANENT_ROWS, surfaceAriaLabel } from "./chart-layout";

describe("chart keyboard (3.4.2)", () => {
  it("starts on the upper-rightmost permanent tooth (patient right)", () => {
    expect(initialFocus("permanent")).toEqual({ tooth: 18, surface: "o" });
    expect(PERMANENT_ROWS[0]?.[0]).toBe(18);
  });

  it("moves across teeth and surfaces with arrows", () => {
    const start = initialFocus("permanent");
    expect(moveFocus(start, "permanent", "ArrowRight").tooth).toBe(17);
    expect(moveFocus(start, "permanent", "ArrowDown").surface).toBe("d");
  });

  it("builds screen-reader labels", () => {
    expect(surfaceAriaLabel(46, "o")).toContain("46");
    expect(surfaceAriaLabel(46, "o")).toContain("occlusal");
  });
});
