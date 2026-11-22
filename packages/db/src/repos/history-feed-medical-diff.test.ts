import { describe, expect, it } from "vitest";
import { summariseMedicalChange } from "./history-feed-medical-diff";

describe("summariseMedicalChange (3.5.13)", () => {
  it("describes first record and answer changes", () => {
    const v1 = JSON.stringify([
      { code: "diabetes", label: "Diabetes", answer: "yes" },
      { code: "asthma", label: "Asthma", answer: "no" },
    ]);
    expect(summariseMedicalChange(null, v1)).toContain("Diabetes");

    const v2 = JSON.stringify([
      { code: "diabetes", label: "Diabetes", answer: "no" },
      { code: "asthma", label: "Asthma", answer: "no" },
    ]);
    expect(summariseMedicalChange(v1, v2)).toBe("Diabetes: yes→no");

    expect(summariseMedicalChange(v2, v2)).toBe("Medical history reviewed (no change)");
  });
});
