import { describe, expect, it } from "vitest";
import { fieldWarnings } from "./clinic-fields";

describe("Clinic and doctor warnings", () => {
  it("warns on the install placeholders and nothing else", () => {
    const w = fieldWarnings({
      "doctor.name": "Dr Sample",
      "doctor.registration_no": "",
      "clinic.phone": "0000000000",
      "clinic.address": "Sample address - set in Settings",
    });
    expect(Object.keys(w).sort()).toEqual([
      "clinic.address",
      "clinic.phone",
      "doctor.name",
      "doctor.registration_no",
    ]);
    expect(
      fieldWarnings({
        "doctor.name": "Dr Real Name",
        "doctor.registration_no": "A-123",
        "clinic.phone": "9876543210",
        "clinic.address": "1 Main Road",
      }),
    ).toEqual({});
  });
  it("an empty phone is also a warning", () => {
    expect(fieldWarnings({ "clinic.phone": "" })["clinic.phone"]).toMatch(/sample number/);
  });
});
