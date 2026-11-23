import { describe, expect, it } from "vitest";
import { messageRecipient, speakForPatient } from "./message-recipient";

const base = {
  fullName: "Kiddo Testcase",
  mobile: null,
  guardianName: null,
  guardianMobile: null,
  emergencyName: null,
  emergencyMobile: null,
};

describe("messageRecipient (Q1.5)", () => {
  it("uses the patient's own mobile and name", () => {
    expect(messageRecipient({ ...base, mobile: "+919000000001" })).toEqual({
      mobile: "+919000000001",
      addressName: "Kiddo",
      onBehalfOf: null,
    });
  });
  it("falls back to the guardian and addresses them", () => {
    const r = messageRecipient({
      ...base,
      guardianName: "Sunita Devi",
      guardianMobile: "+919000000002",
    });
    expect(r).toEqual({ mobile: "+919000000002", addressName: "Sunita", onBehalfOf: "Kiddo" });
  });
  it("then the emergency contact; then nobody", () => {
    expect(messageRecipient({ ...base, emergencyMobile: "+919000000003" }).mobile).toBe(
      "+919000000003",
    );
    expect(messageRecipient(base).mobile).toBeNull();
  });
  it("speaks for the child", () => {
    expect(speakForPatient("Dear Sunita, a reminder of your appointment at X.", "Kiddo")).toBe(
      "Dear Sunita, a reminder of Kiddo's appointment at X.",
    );
    expect(speakForPatient("same", null)).toBe("same");
  });
});
