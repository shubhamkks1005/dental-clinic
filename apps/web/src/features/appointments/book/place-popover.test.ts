import { describe, expect, it } from "vitest";
import { placePopover, sideForColumn, type Rect } from "./place-popover";

const view = { width: 1366, height: 768 };
const pop = { width: 440, height: 600 };
const cell = (left: number, top: number, width = 140, height = 64): Rect => ({
  left,
  top,
  right: left + width,
  width,
  height,
});

describe("placePopover", () => {
  it("opens to the right of a Monday cell", () => {
    expect(placePopover(cell(320, 300), pop, view, "right")).toEqual({ left: 472, top: 156 });
  });

  it("opens to the left of a Friday cell", () => {
    expect(placePopover(cell(900, 200), pop, view, "left")).toEqual({ left: 448, top: 156 });
  });

  it("falls back to the other side when there is no room", () => {
    expect(placePopover(cell(1000, 100), pop, view, "right").left).toBe(548);
    expect(placePopover(cell(100, 100), pop, view, "left").left).toBe(252);
  });

  it("stays 12 px inside the window", () => {
    const p = placePopover(cell(320, 20), pop, view, "right");
    expect(p.top).toBe(12);
    const low = placePopover(cell(320, 740), pop, view, "right");
    expect(low.top).toBe(768 - 600 - 12);
    expect(placePopover(cell(10, 100), { width: 1400, height: 300 }, view, "right").left).toBe(12);
  });

  it("centres without a cell", () => {
    expect(placePopover(null, pop, view, "auto")).toEqual({ left: 463, top: 84 });
  });

  it("picks the side by weekday, and by room in the day view", () => {
    expect(sideForColumn(0, 7)).toBe("right");
    expect(sideForColumn(2, 7)).toBe("right");
    expect(sideForColumn(3, 7)).toBe("left");
    expect(sideForColumn(6, 7)).toBe("left");
    expect(sideForColumn(0, 1)).toBe("auto");
    // A wide day column leaves no room on either side: the popover sits over its right part.
    expect(placePopover(cell(300, 200, 900), pop, view, "auto").left).toBe(914);
    expect(placePopover(cell(700, 200, 140), pop, view, "auto").left).toBe(248);
  });
});
