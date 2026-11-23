import { describe, expect, it } from "vitest";
import { formatBillingNo, shortFinancialYear } from "./billing-numbers";

describe("billing numbers (5.1.2)", () => {
  it("shortens the financial year for the printed series", () => {
    expect(shortFinancialYear("2026-27")).toBe("2627");
    expect(shortFinancialYear("2099-00")).toBe("9900");
  });

  it("formats bill, receipt and refund with six digits", () => {
    expect(formatBillingNo("bill", "2026-27", 123)).toBe("B-2627-000123");
    expect(formatBillingNo("receipt", "2026-27", 1)).toBe("R-2627-000001");
    expect(formatBillingNo("refund", "2027-28", 42)).toBe("F-2728-000042");
  });

  it("uses an S prefix for the shadow series during paper parallel-run", () => {
    expect(formatBillingNo("bill", "2026-27", 5, true)).toBe("SB-2627-000005");
    expect(formatBillingNo("receipt", "2026-27", 5, true)).toBe("SR-2627-000005");
    expect(formatBillingNo("refund", "2026-27", 5, true)).toBe("SF-2627-000005");
  });

  it("refuses a zero or non-integer sequence", () => {
    expect(() => formatBillingNo("bill", "2026-27", 0)).toThrow();
    expect(() => formatBillingNo("bill", "2026-27", 1.5)).toThrow();
  });
});
