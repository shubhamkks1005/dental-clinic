import { describe, expect, it } from "vitest";
import { parseAddToothEvent } from "./tooth-chart-api";

describe("add tooth event body (3.4.5)", () => {
  it("accepts a valid FDI surface event", () => {
    expect(
      parseAddToothEvent({
        visitId: "v1",
        toothFdi: 46,
        surface: "o",
        conditionCode: "filling",
      }),
    ).toEqual({
      ok: true,
      value: { visitId: "v1", toothFdi: 46, surface: "o", conditionCode: "filling" },
    });
  });

  it("refuses bad FDI or surface", () => {
    expect(
      parseAddToothEvent({ visitId: "v1", toothFdi: 99, surface: "o", conditionCode: "x" }).ok,
    ).toBe(false);
    expect(
      parseAddToothEvent({ visitId: "v1", toothFdi: 46, surface: "x", conditionCode: "filling" })
        .ok,
    ).toBe(false);
  });
});
