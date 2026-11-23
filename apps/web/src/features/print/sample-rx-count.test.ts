import { describe, expect, it } from "vitest";
import { parseMedicineLineCount, sampleRxWithMedicineCount } from "./sample-rx-count";

describe("sample Rx medicine count (4.5.1)", () => {
  it("builds 1 and 8 line samples with English fake names", () => {
    expect(sampleRxWithMedicineCount(1).medicines).toHaveLength(1);
    const eight = sampleRxWithMedicineCount(8);
    expect(eight.medicines).toHaveLength(8);
    expect(eight.medicines.every((m) => m.name.includes("Fake"))).toBe(true);
  });

  it("parses only 1..8", () => {
    expect(parseMedicineLineCount("3")).toBe(3);
    expect(parseMedicineLineCount("0")).toBeNull();
    expect(parseMedicineLineCount("9")).toBeNull();
  });
});
