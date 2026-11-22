import { describe, expect, it } from "vitest";
import { estimateTabletCount, prescriptionSafetyWarnings } from "./prescriptions";

describe("prescription helpers (4.2.3 / 4.2.4)", () => {
  it("counts tablets for 1-0-1 × 5 days as 10", () => {
    expect(estimateTabletCount("1", "1-0-1", "5")).toBe(10);
    expect(estimateTabletCount("1 cap", "1-0-1", "5")).toBe(10);
  });

  it("warns on allergy tag match, duplicate and incomplete row", () => {
    const warnings = prescriptionSafetyWarnings(
      [
        {
          genericName: "Amoxicillin",
          dose: "1",
          frequency: "1-0-1",
          days: "5",
          tags: "penicillin",
        },
        {
          genericName: "Amoxicillin",
          dose: "",
          frequency: "1-0-1",
          days: "5",
          tags: "penicillin",
        },
      ],
      {
        allergyTags: [{ tag: "penicillin", label: "Penicillin / antibiotic" }],
        pregnant: false,
      },
    );
    expect(warnings.some((w) => w.includes("Allergy: Penicillin"))).toBe(true);
    expect(warnings.some((w) => w.includes("Duplicate"))).toBe(true);
    expect(warnings.some((w) => w.includes("Incomplete"))).toBe(true);
  });
});
