import { describe, expect, it } from "vitest";
import { isMedicalHistoryStale, MEDICAL_ANSWERS, saveMedicalHistoryBody } from "./medical-history";

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

describe("medical history stale (3.3.4)", () => {
  const now = new Date("2026-11-23T00:00:00.000Z");

  it("is stale at 7 months and not at 2 months when threshold is 6", () => {
    expect(isMedicalHistoryStale("2026-04-23T00:00:00.000Z", 6, now)).toBe(true);
    expect(isMedicalHistoryStale("2026-09-23T00:00:00.000Z", 6, now)).toBe(false);
    expect(isMedicalHistoryStale(null, 6, now)).toBe(true);
  });
});
