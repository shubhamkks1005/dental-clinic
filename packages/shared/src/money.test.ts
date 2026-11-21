import { describe, expect, it } from "vitest";
import { formatRupees } from "./money";

describe("formatRupees", () => {
  it("shows whole rupees with Indian grouping", () => {
    expect(formatRupees(1420000)).toBe("₹14,200");
    expect(formatRupees(1234567800)).toBe("₹1,23,45,678");
    expect(formatRupees(0)).toBe("₹0");
  });

  it("shows paise only when they are not zero", () => {
    expect(formatRupees(150)).toBe("₹1.50");
    expect(formatRupees(12345678)).toBe("₹1,23,456.78");
  });

  it("puts the minus sign before the rupee sign", () => {
    expect(formatRupees(-50000)).toBe("-₹500");
  });

  it("refuses fractions of a paisa (money is never a float)", () => {
    expect(() => formatRupees(10.5)).toThrow();
  });
});
