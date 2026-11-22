import { describe, expect, it } from "vitest";
import { displayMobile, normaliseMobile } from "./mobile";

// 2.1.2: twenty good and twenty bad inputs. Fake numbers only.
const GOOD: [string, string][] = [
  ["9876543210", "+919876543210"],
  ["98765 43210", "+919876543210"],
  ["+91 98765 43210", "+919876543210"],
  ["+91-98765-43210", "+919876543210"],
  ["919876543210", "+919876543210"],
  ["09876543210", "+919876543210"],
  ["(987) 654-3210", "+919876543210"],
  ["6000000000", "+916000000000"],
  ["7000000001", "+917000000001"],
  ["8000000002", "+918000000002"],
  ["9000000003", "+919000000003"],
  ["6 1234 56789", "+916123456789"],
  ["+91(612)345-6789", "+916123456789"],
  ["91 6123456789", "+916123456789"],
  ["06123456789", "+916123456789"],
  ["98765.43210", "+919876543210"],
  ["  9876543210  ", "+919876543210"],
  ["+919876543210", "+919876543210"],
  ["9123456789", "+919123456789"],
  ["7890123456", "+917890123456"],
];

const BAD = [
  "5876543210", // must start with 6-9
  "987654321", // 9 digits
  "98765432101", // 11 without leading 0
  "0512 234567", // landline
  "98765abc10",
  "",
  "+1 9876543210",
  "1234567890",
  "0987654321", // 10 digits after dropping 0 → 9 left? actually 0987654321 → drop 0 → 987654321 (9 digits)
  "++919876543210",
  "91",
  "0000000000",
  "999999999",
  "9876543210a",
  "a9876543210",
  "+44 9876543210",
  "98765 4321", // 9 digits with space
  "51234567890", // 11 starting 5
  "mobile",
  "   ",
];

describe("mobile number rule (2.1.2)", () => {
  it("has twenty good and twenty bad cases", () => {
    expect(GOOD).toHaveLength(20);
    expect(BAD).toHaveLength(20);
  });

  it.each(GOOD)("%s -> %s", (raw, stored) => {
    expect(normaliseMobile(raw)).toBe(stored);
  });

  it.each(BAD)("%s is not a mobile", (raw) => {
    expect(normaliseMobile(raw)).toBeNull();
  });

  it("shows a stored mobile as 5 + 5 digits", () => {
    expect(displayMobile("+919876543210")).toBe("98765 43210");
    expect(displayMobile("+916000000000")).toBe("60000 00000");
  });
});
