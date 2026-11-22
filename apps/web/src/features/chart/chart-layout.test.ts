import { describe, expect, it } from "vitest";
import { rowsForDentition } from "./chart-layout";

describe("chart facing (3.4.3)", () => {
  it("dentist view puts patient's right (18) on the left", () => {
    const upper = rowsForDentition("permanent", "dentist")[0]!;
    expect(upper[0]).toBe(18);
    expect(upper[upper.length - 1]).toBe(28);
  });

  it("patient facing reverses left-right", () => {
    const upper = rowsForDentition("permanent", "patient")[0]!;
    expect(upper[0]).toBe(28);
    expect(upper[upper.length - 1]).toBe(18);
  });
});
