import { describe, expect, it } from "vitest";
import {
  allocateToBills,
  assertRoundOffInRange,
  BILL_CAP_PAISE,
  billNeedsCapConfirm,
  CASH_WARN_PAISE,
  formatRupees,
  percentDiscountPaise,
  roundHalfUpPaise,
  roundOffToRupee,
  unallocatedPaise,
} from "./money";

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

describe("paise rules (5.1.3)", () => {
  it("rounds half-up to the nearest paisa", () => {
    expect(roundHalfUpPaise(10.4)).toBe(10);
    expect(roundHalfUpPaise(10.5)).toBe(11);
    expect(roundHalfUpPaise(-10.5)).toBe(-11);
  });

  it("applies percent discount with half-up on the paisa product", () => {
    // 10% of ₹100.00 = ₹10.00
    expect(percentDiscountPaise(100_00, 10)).toBe(10_00);
    // 10% of ₹1.15 = 11.5 → 12 paise
    expect(percentDiscountPaise(115, 10)).toBe(12);
    // 33% of ₹100.00 = 3300 paise exactly
    expect(percentDiscountPaise(100_00, 33)).toBe(33_00);
    expect(percentDiscountPaise(100_00, 0)).toBe(0);
    expect(() => percentDiscountPaise(100, 101)).toThrow();
    expect(() => percentDiscountPaise(10.5, 10)).toThrow();
  });

  it("builds a round-off line within ± ₹0.99 toward the nearer rupee", () => {
    expect(roundOffToRupee(100_00)).toBe(0);
    expect(roundOffToRupee(100_40)).toBe(-40);
    expect(roundOffToRupee(100_60)).toBe(40);
    expect(roundOffToRupee(100_50)).toBe(50); // half-up
    assertRoundOffInRange(99);
    assertRoundOffInRange(-99);
    expect(() => assertRoundOffInRange(100)).toThrow();
  });

  it("flags totals above the bill cap for confirmation", () => {
    expect(billNeedsCapConfirm(BILL_CAP_PAISE)).toBe(false);
    expect(billNeedsCapConfirm(BILL_CAP_PAISE + 1)).toBe(true);
    expect(CASH_WARN_PAISE).toBe(2_00_00_000);
  });

  it("allocates a payment across bills without exceeding any due", () => {
    expect(
      allocateToBills(150_00, [
        { billId: "a", duePaise: 100_00 },
        { billId: "b", duePaise: 80_00 },
      ]),
    ).toEqual([
      { billId: "a", amountPaise: 100_00 },
      { billId: "b", amountPaise: 50_00 },
    ]);
    expect(allocateToBills(50_00, [{ billId: "a", duePaise: 0 }])).toEqual([]);
    expect(() => allocateToBills(10, [{ billId: "a", duePaise: -1 }])).toThrow();
  });

  it("treats unallocated payment as advance credit", () => {
    expect(unallocatedPaise(200_00, [{ amountPaise: 150_00 }])).toBe(50_00);
    expect(unallocatedPaise(100_00, [{ amountPaise: 100_00 }])).toBe(0);
    expect(() => unallocatedPaise(50_00, [{ amountPaise: 60_00 }])).toThrow();
  });
});
