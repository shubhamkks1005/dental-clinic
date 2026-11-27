import { describe, expect, it } from "vitest";
import { remainingAsDiscount, visitMoney } from "./visit-money";

describe("visitMoney (visit finished)", () => {
  it("says remaining, extra or nothing", () => {
    expect(visitMoney(120_000, 100_000)).toEqual({ kind: "remaining", amountPaise: 20_000 });
    expect(visitMoney(60_000, 100_000)).toEqual({ kind: "extra", amountPaise: 40_000 });
    expect(visitMoney(100_000, 100_000)).toEqual({ kind: "none", amountPaise: 0 });
    expect(visitMoney(0, 0)).toEqual({ kind: "none", amountPaise: 0 });
  });
});

describe("remainingAsDiscount", () => {
  it("fills the remaining and clamps", () => {
    expect(remainingAsDiscount(120_000, 100_000)).toBe(20_000);
    expect(remainingAsDiscount(120_000, 150_000)).toBe(0);
    expect(remainingAsDiscount(120_000, 0)).toBe(120_000);
    expect(remainingAsDiscount(0, 0)).toBe(0);
  });
});
