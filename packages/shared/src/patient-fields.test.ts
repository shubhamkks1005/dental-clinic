import { describe, expect, it } from "vitest";
import {
  PATIENT_FIELDS,
  PATIENT_GENDERS,
  PATIENT_MESSAGE_LANGUAGES,
  PATIENT_SAVE_REQUIRED,
  PATIENT_STATUSES,
} from "./patient-fields";

describe("patient fields (2.1.1)", () => {
  it("lists every field with a purpose and marks the save-critical ones", () => {
    expect(PATIENT_FIELDS.length).toBeGreaterThanOrEqual(15);
    expect(PATIENT_FIELDS.every((f) => f.label.length > 0 && f.purpose.length > 10)).toBe(true);
    for (const key of PATIENT_SAVE_REQUIRED) {
      expect(PATIENT_FIELDS.some((f) => f.key === key)).toBe(true);
    }
  });

  it("keeps enums small and English-only labels", () => {
    expect([...PATIENT_GENDERS]).toEqual(["female", "male", "other"]);
    expect([...PATIENT_STATUSES]).toEqual(["active", "archived"]);
    expect([...PATIENT_MESSAGE_LANGUAGES]).toEqual(["english", "hinglish"]);
    expect(PATIENT_FIELDS.find((f) => f.key === "full_name")?.required).toBe(true);
    expect(PATIENT_FIELDS.find((f) => f.key === "notes")?.required).toBe(false);
    expect(PATIENT_FIELDS.some((f) => f.key === "guardian_name")).toBe(true);
    expect(PATIENT_FIELDS.some((f) => f.key === "guardian_mobile")).toBe(true);
  });
});
