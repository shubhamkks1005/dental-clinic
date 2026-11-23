// 5.3.10: amount in English words for receipts (Indian numbering: lakh, crore).

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underThousand(n: number): string {
  if (n < 20) return ONES[n]!;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${TENS[t]} ${ONES[o]}` : TENS[t]!;
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest ? `${ONES[h]} hundred ${underThousand(rest)}` : `${ONES[h]} hundred`;
}

function underCrore(n: number): string {
  if (n === 0) return "";
  if (n < 1000) return underThousand(n);
  if (n < 100_000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    const head = th < 20 ? underThousand(th) : underThousand(th);
    return rest ? `${head} thousand ${underThousand(rest)}` : `${head} thousand`;
  }
  if (n < 10_000_000) {
    const lakh = Math.floor(n / 100_000);
    const rest = n % 100_000;
    const head = underThousand(lakh);
    return rest ? `${head} lakh ${underCrore(rest)}` : `${head} lakh`;
  }
  const crore = Math.floor(n / 10_000_000);
  const rest = n % 10_000_000;
  const head = underThousand(crore);
  return rest ? `${head} crore ${underCrore(rest)}` : `${head} crore`;
}

/** Paise → "Rupees … only" (English, Indian grouping words). */
export function amountInWords(paise: number): string {
  if (!Number.isInteger(paise) || paise < 0) {
    throw new Error("Amount must be a non-negative whole number of paise");
  }
  const rupees = Math.floor(paise / 100);
  const rem = paise % 100;
  if (rupees === 0 && rem === 0) return "Rupees zero only";
  const parts: string[] = [];
  if (rupees > 0) {
    const body = underCrore(rupees).replace(/\s+/g, " ").trim();
    parts.push(`Rupees ${body}`);
  } else {
    parts.push("Rupees zero");
  }
  if (rem > 0) {
    parts.push(`and ${underThousand(rem)} paise`);
  }
  return `${parts.join(" ")} only`;
}
