import { describe, expect, it } from "vitest";
import { annotationsSchema, measureLength, parseSaveAnnotations } from "./file-annotations";

const line = { id: "m1", type: "measure", x1: 0, y1: 0, x2: 30, y2: 40 } as const;

describe("file annotations (B8)", () => {
  it("accepts every kind of mark inside the viewer box", () => {
    const ok = annotationsSchema.safeParse({
      v: 1,
      scale: null,
      items: [
        {
          id: "a",
          type: "pen",
          points: [
            [0, 0],
            [400, 300],
          ],
        },
        { id: "b", type: "circle", cx: 10, cy: 10, r: 5, color: "#E11D48" },
        { id: "c", type: "arrow", x1: 1, y1: 1, x2: 2, y2: 2 },
        { id: "d", type: "text", x: 5, y: 5, text: "  Radiolucency  " },
        line,
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("refuses a point outside 400 x 300, an unknown mark, empty text and too many marks", () => {
    const bad = (items: unknown[]) => annotationsSchema.safeParse({ v: 1, scale: null, items });
    expect(bad([{ id: "a", type: "circle", cx: 401, cy: 1, r: 2 }]).success).toBe(false);
    expect(bad([{ id: "a", type: "star" }]).success).toBe(false);
    expect(bad([{ id: "a", type: "text", x: 1, y: 1, text: "  " }]).success).toBe(false);
    const many = Array.from({ length: 201 }, (_, i) => ({ ...line, id: `m${i}` }));
    expect(bad(many).success).toBe(false);
  });

  it("checks the scale against the known length and measures in mm only when calibrated", () => {
    const withScale = (mmPerUnit: number) =>
      annotationsSchema.safeParse({
        v: 1,
        scale: { mmPerUnit, knownMm: 10, lineUnits: 50 },
        items: [],
      });
    expect(withScale(0.2).success).toBe(true);
    expect(withScale(0.12).success).toBe(false);
    expect(measureLength(line, null)).toEqual({ value: 50, unit: "px" });
    expect(measureLength(line, { mmPerUnit: 0.2, knownMm: 10, lineUnits: 50 })).toEqual({
      value: 10,
      unit: "mm",
    });
  });

  it("parses the save body and refuses a missing version", () => {
    const body = { version: 2, annotations: { v: 1, scale: null, items: [] } };
    expect(parseSaveAnnotations(body).ok).toBe(true);
    expect(parseSaveAnnotations({ annotations: body.annotations }).ok).toBe(false);
  });
});
