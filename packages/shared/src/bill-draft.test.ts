import { describe, expect, it } from "vitest";
import { feeChangeReasonOk, parseUpdateDraftBill } from "./bill-draft";

describe("feeChangeReasonOk (5.3.1)", () => {
  it("allows same fee without a reason", () => {
    expect(feeChangeReasonOk(150_000, 150_000, null)).toBe(true);
  });

  it("requires a reason when fee differs from list", () => {
    expect(feeChangeReasonOk(100_000, 150_000, null)).toBe(false);
    expect(feeChangeReasonOk(100_000, 150_000, "Patient bargain")).toBe(true);
  });

  it("allows custom lines with no list fee", () => {
    expect(feeChangeReasonOk(50_000, null, null)).toBe(true);
  });
});

describe("parseUpdateDraftBill", () => {
  it("accepts a draft replace payload", () => {
    const r = parseUpdateDraftBill({
      version: 1,
      items: [{ procedureLabel: "Scaling", unitPaise: 150_000, qty: 1 }],
    });
    expect(r.ok).toBe(true);
  });
});
