// 5.1.2: bill / receipt / refund numbers. Gap-free seq comes from counters + takeNumber.
// Shape: B-2627-000123 (or SB-… when shadow_series is on so paper books do not collide).

export const BILLING_DOC_KINDS = ["bill", "receipt", "refund"] as const;
export type BillingDocKind = (typeof BILLING_DOC_KINDS)[number];

const LETTER: Record<BillingDocKind, string> = {
  bill: "B",
  receipt: "R",
  refund: "F",
};

/** "2026-27" → "2627" for the printed series. */
export function shortFinancialYear(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) throw new Error("Financial year must look like 2026-27");
  return `${m[1]!.slice(2)}${m[2]}`;
}

export function formatBillingNo(
  kind: BillingDocKind,
  period: string,
  seq: number,
  shadowSeries = false,
): string {
  if (!Number.isInteger(seq) || seq < 1)
    throw new Error("Document number must be a positive integer");
  const letter = LETTER[kind];
  const prefix = shadowSeries ? `S${letter}` : letter;
  return `${prefix}-${shortFinancialYear(period)}-${String(seq).padStart(6, "0")}`;
}
