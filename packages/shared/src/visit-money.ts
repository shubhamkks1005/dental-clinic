// Visit finished page: the one money line under the invoice total. One rule in one place, used by
// the page and by the server's lock (extra paid must be Returned or Kept before locking).

export type VisitMoney =
  | { kind: "remaining"; amountPaise: number }
  | { kind: "extra"; amountPaise: number }
  | { kind: "none"; amountPaise: 0 };

/** `paidPaise` = paid at arrival (unallocated today) + already received on this invoice. */
export function visitMoney(totalPaise: number, paidPaise: number): VisitMoney {
  const diff = totalPaise - paidPaise;
  if (diff > 0) return { kind: "remaining", amountPaise: diff };
  if (diff < 0) return { kind: "extra", amountPaise: -diff };
  return { kind: "none", amountPaise: 0 };
}

/** "Remaining as discount": the whole remaining, never below 0 and never above the subtotal. */
export function remainingAsDiscount(subtotalPaise: number, paidPaise: number): number {
  return Math.min(Math.max(0, subtotalPaise - paidPaise), Math.max(0, subtotalPaise));
}

export const VISIT_MONEY_LABEL: Record<VisitMoney["kind"], string> = {
  remaining: "Remaining",
  extra: "Extra paid",
  none: "Nothing remaining",
};
