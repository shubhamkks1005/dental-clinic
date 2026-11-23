// Money is always an integer number of paise (AGENTS.md). One module for display, rounding,
// percent discount, round-off line, and bill cap (5.1.3).

/** Soft warn when a single cash receipt reaches this (₹2 lakh). DRAFT - accountant to confirm. */
export const CASH_WARN_PAISE = 2_00_00_000;

/** Soft confirm when a bill total exceeds this (₹10 lakh). */
export const BILL_CAP_PAISE = 10_00_00_000;

/** Round-off line may not exceed ± ₹0.99. */
export const ROUND_OFF_MAX_PAISE = 99;

export function assertPaise(paise: number, label = "Money"): asserts paise is number {
  if (!Number.isInteger(paise)) throw new Error(`${label} must be a whole number of paise`);
}

// Rupee sign, Indian digit grouping, paise only when they are not zero.
export function formatRupees(paise: number): string {
  assertPaise(paise);
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = new Intl.NumberFormat("en-IN").format(Math.floor(abs / 100));
  const rest = abs % 100;
  return `${sign}₹${rupees}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
}

/** Half-up to nearest paisa: (n + 50) / 100 * sign for positive products. */
export function roundHalfUpPaise(raw: number): number {
  if (!Number.isFinite(raw)) throw new Error("Money must be finite");
  if (raw >= 0) return Math.floor(raw + 0.5);
  return -Math.floor(-raw + 0.5);
}

/**
 * Percent discount on an amount in paise. `percent` is a whole percent (0–100), e.g. 10 = 10%.
 * Rounding is half-up on the paisa product.
 */
export function percentDiscountPaise(amountPaise: number, percent: number): number {
  assertPaise(amountPaise, "Amount");
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error("Discount percent must be a whole number from 0 to 100");
  }
  if (amountPaise < 0) throw new Error("Amount must not be negative");
  return roundHalfUpPaise((amountPaise * percent) / 100);
}

/**
 * Round-off so (subtotal + roundOff) is a whole rupee (multiple of 100 paise),
 * with |roundOff| ≤ 99. Prefer the smaller absolute adjustment toward the nearer rupee.
 */
export function roundOffToRupee(subtotalPaise: number): number {
  assertPaise(subtotalPaise, "Subtotal");
  const rem = ((subtotalPaise % 100) + 100) % 100;
  if (rem === 0) return 0;
  const up = 100 - rem;
  const down = -rem;
  // Prefer rounding to nearest; ties (50) go up (half-up).
  if (rem < 50) return down;
  if (rem > 50) return up;
  return up;
}

export function assertRoundOffInRange(roundOffPaise: number): void {
  assertPaise(roundOffPaise, "Round-off");
  if (Math.abs(roundOffPaise) > ROUND_OFF_MAX_PAISE) {
    throw new Error("Round-off cannot be more than ₹0.99");
  }
}

export function billNeedsCapConfirm(totalPaise: number): boolean {
  assertPaise(totalPaise, "Total");
  return totalPaise > BILL_CAP_PAISE;
}

/** Split a payment amount across open bill balances; never allocate more than a bill’s due. */
export function allocateToBills(
  amountPaise: number,
  dues: readonly { billId: string; duePaise: number }[],
): { billId: string; amountPaise: number }[] {
  assertPaise(amountPaise, "Payment");
  if (amountPaise < 0) throw new Error("Payment must not be negative");
  let left = amountPaise;
  const out: { billId: string; amountPaise: number }[] = [];
  for (const d of dues) {
    assertPaise(d.duePaise, "Due");
    if (d.duePaise < 0) throw new Error("Due must not be negative");
    if (left <= 0) break;
    const take = Math.min(left, d.duePaise);
    if (take > 0) {
      out.push({ billId: d.billId, amountPaise: take });
      left -= take;
    }
  }
  return out;
}

/** Remaining unallocated payment becomes patient advance (credit). */
export function unallocatedPaise(
  amountPaise: number,
  allocations: readonly { amountPaise: number }[],
): number {
  assertPaise(amountPaise, "Payment");
  let used = 0;
  for (const a of allocations) {
    assertPaise(a.amountPaise, "Allocation");
    if (a.amountPaise < 0) throw new Error("Allocation must not be negative");
    used += a.amountPaise;
  }
  if (used > amountPaise) throw new Error("Allocations cannot exceed the payment");
  return amountPaise - used;
}
