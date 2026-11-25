import { describe, expect, it } from "vitest";
import {
  FRESH_ADJUST,
  FRESH_VIEW,
  adjustFilter,
  clampZoom,
  makeMark,
  makeScale,
  measureLabel,
  push,
  redo,
  rotateBy,
  toggleTooth,
  toViewerPoint,
  trail,
  undo,
  viewTransform,
  zoomPercent,
} from "./xray-model";

const opts = { width: 2.5, text: "Apex 36", color: "#E11D48", path: [] as [number, number][] };

describe("view", () => {
  it("zoom stays between 40 and 600 percent", () => {
    expect(clampZoom(0.1)).toBe(0.4);
    expect(clampZoom(9)).toBe(6);
    expect(zoomPercent(1.2)).toBe("120%");
  });
  it("rotates in 90 degree steps both ways and flips by sign of the scale", () => {
    expect(rotateBy(FRESH_VIEW, -90).rotate).toBe(270);
    expect(rotateBy(rotateBy(FRESH_VIEW, 90), 270).rotate).toBe(0);
    expect(viewTransform({ ...FRESH_VIEW, flipH: true, zoom: 2 })).toContain("scale(-2, 2)");
    expect(viewTransform({ ...FRESH_VIEW, flipV: true })).toContain("scale(1, -1)");
  });
  it("the filter follows the sliders and the switches", () => {
    expect(adjustFilter(FRESH_ADJUST)).toBe("brightness(100%) contrast(100%)");
    expect(adjustFilter({ ...FRESH_ADJUST, gray: true, invert: true, enhance: true })).toContain(
      "contrast(125%)",
    );
    expect(adjustFilter({ ...FRESH_ADJUST, brightness: 140 })).toContain("brightness(140%)");
  });
});

describe("marks", () => {
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  it("a pointer becomes viewer space 400 by 300 and never leaves the image", () => {
    expect(toViewerPoint(500, 350, rect)).toEqual([200, 150]);
    expect(toViewerPoint(0, 0, rect)).toEqual([0, 0]);
    expect(toViewerPoint(5000, 5000, rect)).toEqual([400, 300]);
  });

  it("each tool makes its own mark with the chosen width; a tiny tap makes none", () => {
    expect(makeMark("circle", "a", [100, 100], [130, 140], opts)).toMatchObject({
      type: "circle",
      cx: 100,
      cy: 100,
      r: 50,
      width: 2.5,
    });
    expect(makeMark("arrow", "b", [1, 1], [50, 60], opts)).toMatchObject({ type: "arrow", x2: 50 });
    expect(makeMark("measure", "c", [0, 0], [30, 40], opts)).toMatchObject({ type: "measure" });
    expect(makeMark("arrow", "d", [10, 10], [10.5, 10.5], opts)).toBeNull();
    expect(makeMark("text", "e", [20, 20], [20, 20], opts)).toMatchObject({ text: "Apex 36" });
    expect(makeMark("text", "f", [20, 20], [20, 20], { ...opts, text: "  " })).toBeNull();
    expect(
      makeMark("pen", "g", [0, 0], [5, 5], {
        ...opts,
        path: [
          [0, 0],
          [5, 5],
        ],
      }),
    ).toMatchObject({
      type: "pen",
    });
    expect(makeMark("pen", "h", [0, 0], [0, 0], opts)).toBeNull();
  });

  it("measure says mm only after calibration, pixels before", () => {
    const m = makeMark("measure", "m", [0, 0], [30, 40], opts) as Parameters<
      typeof measureLabel
    >[0];
    expect(measureLabel(m, null)).toBe("50 px");
    const scale = makeScale({ x1: 0, y1: 0, x2: 50, y2: 0 }, 10);
    expect(scale).toEqual({ mmPerUnit: 0.2, knownMm: 10, lineUnits: 50 });
    expect(measureLabel(m, scale)).toBe("10 mm");
    expect(makeScale({ x1: 0, y1: 0, x2: 0, y2: 0 }, 10)).toBeNull();
    expect(makeScale({ x1: 0, y1: 0, x2: 10, y2: 0 }, 0)).toBeNull();
  });
});

describe("undo and redo", () => {
  it("steps back and forward, and a new change drops what was undone", () => {
    let t = trail<string[]>([]);
    t = push(t, ["a"]);
    t = push(t, ["a", "b"]);
    expect(undo(t).present).toEqual(["a"]);
    expect(redo(undo(t)).present).toEqual(["a", "b"]);
    expect(push(undo(t), ["a", "c"]).future).toEqual([]);
    expect(undo(trail(1)).present).toBe(1);
    expect(redo(trail(1)).present).toBe(1);
  });
});

describe("teeth tags", () => {
  it("adds, removes and keeps them sorted", () => {
    expect(toggleTooth([36], 24)).toEqual([24, 36]);
    expect(toggleTooth([24, 36], 36)).toEqual([24]);
  });
});

describe("mark buttons and moving", () => {
  const circle = { id: "c", type: "circle", cx: 100, cy: 100, r: 20 } as const;
  it("anchors the buttons at the top right of each mark and colours by tool", async () => {
    const { anchorOf, markColor } = await import("./xray-model");
    expect(anchorOf(circle)).toEqual({ x: 120, y: 80 });
    expect(anchorOf({ id: "a", type: "arrow", x1: 5, y1: 50, x2: 395, y2: 3 })).toEqual({
      x: 388,
      y: 12,
    });
    expect(markColor(circle)).toBe("#f59e0b");
    expect(markColor({ ...circle, color: "#112233" })).toBe("#112233");
  });
  it("moves a mark and keeps it inside the picture", async () => {
    const { moveMark } = await import("./xray-model");
    expect(moveMark(circle, 10, -5)).toMatchObject({ cx: 110, cy: 95 });
    expect(moveMark(circle, 999, 999)).toMatchObject({ cx: 400, cy: 300 });
    expect(moveMark({ id: "l", type: "arrow", x1: 1, y1: 1, x2: 5, y2: 5 }, -10, 0)).toMatchObject({
      x1: 0,
      x2: 0,
    });
  });
});
