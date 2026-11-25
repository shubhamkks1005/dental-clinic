// Visit finished page: where is the money part of this visit? One rule in one place, used by the
// doctor's page and by the desk's "Ready to bill" list (bills-ready.ts).
export const BILL_STATE_WORDS = ["not_billed", "draft", "with_reception", "paid"] as const;
export type BillStateWord = (typeof BILL_STATE_WORDS)[number];

export const BILL_STATE_LABEL: Record<BillStateWord, string> = {
  not_billed: "Not billed",
  draft: "Draft (not passed)",
  with_reception: "With reception",
  paid: "Paid",
};

/**
 * `bill` is the visit's live bill (not cancelled, not deleted) or null. `paidPaise` is what it has
 * really been paid (refunds already taken off). Issued with a balance means the desk has it.
 */
export function billStateWord(
  bill: { status: string; totalPaise: number } | null,
  paidPaise: number,
): BillStateWord {
  if (!bill || bill.status === "cancelled") return "not_billed";
  if (bill.status === "draft") return "draft";
  return bill.totalPaise - paidPaise > 0 ? "with_reception" : "paid";
}

/** The desk's "Ready to bill": everything except Paid (and a visit that was never finalised). */
export const isReadyToBill = (state: BillStateWord) => state !== "paid";
