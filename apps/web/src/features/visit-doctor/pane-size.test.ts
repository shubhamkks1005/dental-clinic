import { describe, expect, it } from "vitest";
import { clampPaneHeight, clampPaneWidth } from "./pane-size";

describe("side pane size", () => {
  it("keeps the width between 280 and 680, and leaves 420 for the left side", () => {
    expect(clampPaneWidth(100, 1400)).toBe(280);
    expect(clampPaneWidth(900, 1400)).toBe(680);
    expect(clampPaneWidth(500, 1400)).toBe(500);
    expect(clampPaneWidth(600, 900)).toBe(480);
    expect(clampPaneWidth(600, 600)).toBe(320);
  });
  it("keeps the height between 260 and 920", () => {
    expect(clampPaneHeight(10)).toBe(260);
    expect(clampPaneHeight(5000)).toBe(920);
    expect(clampPaneHeight(500)).toBe(500);
  });
});
