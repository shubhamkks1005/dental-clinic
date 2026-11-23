import { describe, expect, it } from "vitest";
import { computeBillTotals, parseCreateBill } from "./billing";

describe("computeBillTotals (5.2.1)", () => {
  it("totals always match the items (gst off)", () => {
    const t = computeBillTotals(
      [
        { procedureLabel: "Scaling", qty: 1, unitPaise: 150_000, taxCategory: "exempt" },
        { procedureLabel: "Filling", qty: 2, unitPaise: 80_000, discountPaise: 1000 },
      ],
      { gstMode: "off" },
    );
    // lines: 150000 + (160000-1000) = 309000; round-off to nearest rupee = 0
    expect(t.subtotalPaise).toBe(309_000);
    expect(t.taxPaise).toBe(0);
    expect(t.totalPaise).toBe(t.subtotalPaise - t.discountPaise + t.taxPaise + t.roundOffPaise);
    expect(t.items.reduce((s, i) => s + i.lineTotalPaise, 0)).toBe(309_000);
  });

  it("adds tax when gst_mode is on (test only; DRAFT CA)", () => {
    const t = computeBillTotals(
      [{ procedureLabel: "Whitening", qty: 1, unitPaise: 100_000, taxCategory: "cosmetic" }],
      { gstMode: "on" },
    );
    expect(t.taxPaise).toBe(18_000);
    expect(t.totalPaise).toBe(118_000);
  });

  it("applies bill percent discount with half-up", () => {
    const t = computeBillTotals([{ procedureLabel: "X", qty: 1, unitPaise: 115 }], {
      gstMode: "off",
      billDiscountPercent: 10,
    });
    expect(t.discountPaise).toBe(12);
  });
});

describe("parseCreateBill", () => {
  it("accepts a minimal fake bill", () => {
    const r = parseCreateBill({
      patientId: "p1",
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Consult", unitPaise: 50000 }],
    });
    expect(r.ok).toBe(true);
  });
});
