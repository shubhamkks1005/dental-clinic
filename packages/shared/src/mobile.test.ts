import { describe, expect, it } from "vitest";
import { displayMobile, normaliseMobile } from "./mobile";

// Fake numbers only.
describe("mobile number rule (1.4.4, plan 2.1.2)", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["(987) 654-3210", "+919876543210"],
    ["6000000000", "+916000000000"],
  ])("%s -> %s", (raw, stored) => {
    expect(normaliseMobile(raw)).toBe(stored);
  });

  it.each([
    "5876543210", // must start with 6-9
    "987654321", // 9 digits
    "98765432101", // 11 digits without a leading 0
    "0512 234567", // landline
    "98765abc10",
    "",
    "+1 9876543210",
  ])("%s is not a mobile", (raw) => {
    expect(normaliseMobile(raw)).toBeNull();
  });

  it("shows a stored mobile as 5 + 5 digits", () => {
    expect(displayMobile("+919876543210")).toBe("98765 43210");
  });
});
