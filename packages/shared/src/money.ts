// Money is always an integer number of paise (AGENTS.md). This is the one display format:
// rupee sign, Indian digit grouping, and paise only when they are not zero.
export function formatRupees(paise: number): string {
  if (!Number.isInteger(paise)) throw new Error("Money must be a whole number of paise");
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = new Intl.NumberFormat("en-IN").format(Math.floor(abs / 100));
  const rest = abs % 100;
  return `${sign}₹${rupees}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
}
