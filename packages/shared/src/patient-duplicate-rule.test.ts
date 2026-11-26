import { describe, expect, it } from "vitest";
import { duplicateReason } from "./patient-duplicate-rule";

const row = { fullName: "Aakash Verma", mobile: "+919876543210", mobileSecondary: null };

describe("duplicateReason (owner 2026-11-26, Q5)", () => {
  it("same first name and same mobile -> first_name_mobile", () => {
    expect(
      duplicateReason({ fullName: "aakash K", mobile: "98765 43210", mobileSecondary: null }, row),
    ).toBe("first_name_mobile");
    expect(
      duplicateReason(
        { fullName: " Mr.  AAKASH.", mobile: null, mobileSecondary: "9876543210" },
        row,
      ),
    ).toBe("first_name_mobile");
  });

  it("other first name, same mobile -> mobile_only (family member)", () => {
    expect(
      duplicateReason({ fullName: "Ritu Verma", mobile: "9876543210", mobileSecondary: null }, row),
    ).toBe("mobile_only");
  });

  it("matches the row's second mobile too", () => {
    expect(
      duplicateReason(
        { fullName: "Aakash", mobile: "9000000001", mobileSecondary: null },
        { ...row, mobile: "+919111111111", mobileSecondary: "+919000000001" },
      ),
    ).toBe("first_name_mobile");
  });

  it("same name, other mobile -> no match (no name+age rule any more)", () => {
    expect(
      duplicateReason(
        { fullName: "Aakash Verma", mobile: "9123456789", mobileSecondary: null },
        row,
      ),
    ).toBeNull();
    expect(
      duplicateReason({ fullName: "Aakash Verma", mobile: null, mobileSecondary: null }, row),
    ).toBeNull();
  });
});
