import { describe, expect, it } from "vitest";
import { medicineTitle, problemTeeth } from "./rx-model";

describe("prescription sheet words", () => {
  it("groups the lines by tooth, sorted, without repeats and without lines that have no tooth", () => {
    expect(
      problemTeeth([
        { label: "RCT started", toothFdi: 36 },
        { label: "Pulpitis", toothFdi: 36 },
        { label: "RCT started", toothFdi: 36 },
        { label: "Caries", toothFdi: 24 },
        { label: "Check-up", toothFdi: null },
      ]),
    ).toEqual([
      { fdi: 24, items: ["Caries"] },
      { fdi: 36, items: ["RCT started", "Pulpitis"] },
    ]);
    expect(problemTeeth([])).toEqual([]);
  });

  it("medicine title", () => {
    expect(medicineTitle({ genericName: "Amoxicillin", brand: "", strength: "500 mg" })).toBe(
      "Amoxicillin 500 mg",
    );
    expect(medicineTitle({ genericName: "Ibuprofen", brand: "Brufen", strength: "" })).toBe(
      "Brufen (Ibuprofen)",
    );
  });
});
