import { describe, expect, it } from "vitest";
import {
  assertAllowedTemplateVars,
  isGsm7Text,
  lintMessageBody,
  renderMessageTemplate,
  smsSegmentCount,
} from "./message-render";
import { DRAFT_MESSAGE_TEMPLATES, patientFirstName } from "./messaging";

const params = {
  name: "Meena",
  clinic: "Align Dentistry",
  day: "Monday",
  date: "24/11/2026",
  time: "10:30 am",
  phone: "98765 43210",
};

describe("message render (7.2.3)", () => {
  it("renders confirm with allowed vars", () => {
    const text = renderMessageTemplate(DRAFT_MESSAGE_TEMPLATES, "confirm", params);
    expect(text).toContain("Meena");
    expect(text).toContain("Align Dentistry");
    expect(smsSegmentCount(text)).toBe(1);
  });

  it("old Hinglish placeholders in saved templates still render", () => {
    const old = {
      ...DRAFT_MESSAGE_TEMPLATES,
      templates: {
        ...DRAFT_MESSAGE_TEMPLATES.templates,
        confirm: "Dear {naam}, {clinic} on {din} {tareekh}, {samay}. Call {fone}.",
      },
    };
    expect(renderMessageTemplate(old, "confirm", params)).toBe(
      "Dear Meena, Align Dentistry on Monday 24/11/2026, 10:30 am. Call 98765 43210.",
    );
  });

  it("rejects unknown variables", () => {
    expect(() => assertAllowedTemplateVars("Hi {diagnosis}")).toThrow(/Unknown/);
  });

  it("throws on missing param", () => {
    expect(() => renderMessageTemplate(DRAFT_MESSAGE_TEMPLATES, "confirm", { name: "A" })).toThrow(
      /Missing/,
    );
  });

  it("counts GSM vs Unicode segments", () => {
    expect(isGsm7Text("Hello")).toBe(true);
    expect(isGsm7Text("नमस्ते")).toBe(false);
    expect(smsSegmentCount("x".repeat(160))).toBe(1);
    expect(smsSegmentCount("x".repeat(161))).toBe(2);
    expect(smsSegmentCount("न".repeat(70))).toBe(1);
    expect(smsSegmentCount("न".repeat(71))).toBe(2);
  });

  it("lints clinical, money, offer, url", () => {
    expect(lintMessageBody("Your RCT is tomorrow").some((w) => w.code === "clinical_word")).toBe(
      true,
    );
    expect(lintMessageBody("Pay ₹500 now").some((w) => w.code === "money_word")).toBe(true);
    expect(
      lintMessageBody("A payment is pending. Please call us.").some((w) => w.code === "money_word"),
    ).toBe(false);
    expect(lintMessageBody("Free check-up offer").some((w) => w.code === "offer_word")).toBe(true);
    expect(lintMessageBody("See https://evil.example").some((w) => w.code === "url")).toBe(true);
  });

  it("caps long Hindi-style names for first name", () => {
    expect(patientFirstName("Meena Fakepatient").length).toBeLessThanOrEqual(20);
  });

  it("every DRAFT English template is 1 GSM segment with 20-char name", () => {
    const long = {
      ...params,
      name: "A".repeat(20),
    };
    for (const key of [
      "confirm",
      "remind",
      "reschedule",
      "cancel",
      "recall",
      "incomplete",
      "dues",
    ] as const) {
      const text = renderMessageTemplate(DRAFT_MESSAGE_TEMPLATES, key, {
        ...long,
        otp: "123456",
      });
      expect(smsSegmentCount(text), key).toBe(1);
      expect(lintMessageBody(text).filter((w) => w.code === "clinical_word")).toEqual([]);
    }
  });
});
