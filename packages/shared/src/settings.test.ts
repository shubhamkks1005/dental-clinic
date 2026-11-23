import { describe, expect, it } from "vitest";
import { isSettingKey, parseSettingValue, SETTING_KEYS } from "./settings";

describe("setting rules (1.5.1)", () => {
  it("knows the seeded settings and nothing else", () => {
    expect(SETTING_KEYS).toEqual([
      "patient_code.prefix",
      "patient_code.digits",
      "clinic.name",
      "clinic.logo",
      "clinic.timings",
      "clinic.holidays",
      "privacy_notice.version",
      "privacy_notice.body",
      "appointments.book_ahead_days",
      "medical_history.stale_months",
      "chart.view",
      "consent.templates",
      "clinic.address",
      "clinic.phone",
      "clinic.tagline",
      "doctor.name",
      "doctor.qualifications",
      "doctor.speciality",
      "doctor.registration_no",
      "medicines.list_reviewed",
      "billing.shadow_series",
      "billing.gst_mode",
    ]);
    expect(isSettingKey("clinic.name")).toBe(true);
    expect(isSettingKey("nope")).toBe(false);
    expect(isSettingKey("toString")).toBe(false);
  });

  it("good values pass and are cleaned", () => {
    expect(parseSettingValue("patient_code.prefix", "PT-")).toEqual({ ok: true, value: "PT-" });
    expect(parseSettingValue("patient_code.digits", 6)).toEqual({ ok: true, value: 6 });
    expect(parseSettingValue("clinic.name", "  Sample Clinic ")).toEqual({
      ok: true,
      value: "Sample Clinic",
    });
    expect(parseSettingValue("clinic.logo", null)).toEqual({ ok: true, value: null });
  });

  it("bad values are refused with a plain sentence", () => {
    expect(parseSettingValue("patient_code.prefix", "p-")).toMatchObject({
      ok: false,
      message: "Use 1 to 5 capital letters, digits or dashes, for example P-.",
    });
    expect(parseSettingValue("patient_code.digits", 12)).toMatchObject({
      message: "Use at most 8 digits.",
    });
    expect(parseSettingValue("patient_code.digits", "6")).toMatchObject({
      message: "Enter a number.",
    });
    expect(parseSettingValue("patient_code.digits", 5.5)).toMatchObject({
      message: "Use a whole number.",
    });
    expect(parseSettingValue("clinic.name", "   ")).toMatchObject({
      message: "Enter the clinic name.",
    });
  });
});
