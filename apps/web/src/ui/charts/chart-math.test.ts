import { describe, expect, it } from "vitest";
import { barLayout, heatGrid, linePath, niceMax, sparkPath, stackedLayout } from "./chart-math";

describe("chart-math (6.3.2)", () => {
  it("niceMax rounds up for readable axes", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(12)).toBe(20);
  });

  it("barLayout places bars and keeps values readable by index", () => {
    const { bars, max } = barLayout(
      [
        { label: "Mon", value: 2 },
        { label: "Tue", value: 5 },
      ],
      200,
      100,
    );
    expect(max).toBe(5);
    expect(bars).toHaveLength(2);
    expect(bars[1]!.height).toBeGreaterThan(bars[0]!.height);
    expect(bars[0]!.label).toBe("Mon");
  });

  it("stackedLayout stacks parts bottom-up", () => {
    const { columns } = stackedLayout(
      [
        {
          label: "Nov",
          parts: [
            { key: "new", value: 2 },
            { key: "ret", value: 3 },
          ],
        },
      ],
      ["new", "ret"],
      200,
      100,
    );
    expect(columns[0]!.segments).toHaveLength(2);
    const [bottom, top] = columns[0]!.segments;
    // Second series sits on top of the first (bottom-up stack).
    expect(top!.y + top!.height).toBeCloseTo(bottom!.y, 5);
  });

  it("linePath and sparkPath emit SVG path commands", () => {
    const line = linePath(
      [
        { label: "1", value: 1 },
        { label: "2", value: 3 },
      ],
      100,
      40,
    );
    expect(line.d.startsWith("M")).toBe(true);
    expect(line.points).toHaveLength(2);
    expect(sparkPath([1, 2, 1], 40, 12)).toMatch(/^M/);
  });

  it("heatGrid builds a matrix and finds the busiest cell", () => {
    const g = heatGrid([
      { row: "Mon", col: "10", value: 1 },
      { row: "Mon", col: "11", value: 9 },
      { row: "Tue", col: "10", value: 2 },
    ]);
    expect(g.matrix[0]![1]).toBe(9);
    expect(g.max).toBe(10);
  });
});
