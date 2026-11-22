import { describe, expect, it } from "vitest";
import { MEDICAL_ANSWERS, saveMedicalHistoryBody } from "./medical-history";

describe("medical history shared (3.2.4)", () => {
  it("parses a save body", () => {
    expect([...MEDICAL_ANSWERS]).toEqual(["yes", "no", "unknown"]);
    const body = saveMedicalHistoryBody.parse({
      patientId: "p1",
      items: [{ code: "bp", label: "High BP", answer: "yes", alertLabel: "Bleeding risk" }],
    });
    expect(body.items[0]?.alertLabel).toBe("Bleeding risk");
  });
});
