import { describe, expect, it } from "vitest";
import { allocateToBills, percentDiscountPaise, roundOffToRupee, unallocatedPaise } from "./money";
import { computeBillTotals } from "./billing";

/** Seeded PRNG so CI is deterministic (5.5.1 property-style, no new deps). */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("money property checks (5.5.1)", () => {
  it("discount never exceeds amount; round-off stays in ±99; allocate never over-dues", () => {
    const rnd = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const amount = Math.floor(rnd() * 5_00_00_000);
      const percent = Math.floor(rnd() * 101);
      const disc = percentDiscountPaise(amount, percent);
      expect(disc).toBeGreaterThanOrEqual(0);
      expect(disc).toBeLessThanOrEqual(amount);

      const sub = Math.floor(rnd() * 10_00_000); // bills are non-negative
      const off = roundOffToRupee(sub);
      expect(Math.abs(off)).toBeLessThanOrEqual(99);
      expect((sub + off) % 100).toBe(0);

      const dues = [
        { billId: "a", duePaise: Math.floor(rnd() * 50_000) },
        { billId: "b", duePaise: Math.floor(rnd() * 50_000) },
      ];
      const pay = Math.floor(rnd() * 1_00_000);
      const alloc = allocateToBills(pay, dues);
      const used = alloc.reduce((s, a) => s + a.amountPaise, 0);
      expect(used).toBeLessThanOrEqual(pay);
      for (const a of alloc) {
        const due = dues.find((d) => d.billId === a.billId)!.duePaise;
        expect(a.amountPaise).toBeLessThanOrEqual(due);
      }
      expect(unallocatedPaise(pay, alloc)).toBe(pay - used);
    }
  });

  it("computeBillTotals stays integer and matches line maths (gst off)", () => {
    const rnd = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const unit = Math.floor(rnd() * 200_000);
      const qty = 1 + Math.floor(rnd() * 3);
      const lineDisc = Math.floor(rnd() * Math.min(unit * qty + 1, 5_000));
      const totals = computeBillTotals(
        [{ procedureLabel: "Fake", qty, unitPaise: unit, discountPaise: lineDisc }],
        { gstMode: "off" },
      );
      expect(Number.isInteger(totals.totalPaise)).toBe(true);
      expect(totals.taxPaise).toBe(0);
      expect(Math.abs(totals.roundOffPaise)).toBeLessThanOrEqual(99);
      expect(totals.subtotalPaise).toBe(unit * qty - lineDisc);
    }
  });
});
