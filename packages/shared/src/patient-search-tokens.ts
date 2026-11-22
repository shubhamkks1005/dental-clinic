// 2.1.6: tokens for patient_search. Always lowercase; range query uses tokenRangeEnd (not LIKE).

export const SEARCH_TOKEN_KINDS = ["name", "mobile", "mobile_rev", "code", "legacy"] as const;
export type SearchTokenKind = (typeof SEARCH_TOKEN_KINDS)[number];

export type SearchToken = { token: string; kind: SearchTokenKind };

/** Honorifics dropped before name words (plan 2.1.6). */
const HONORIFICS = new Set(["mr", "mrs", "ms", "smt", "shri", "dr", "master", "baby"]);

export type PatientTokenSource = {
  fullName: string;
  code: string;
  mobile: string | null;
  mobileSecondary: string | null;
  legacyRef: string | null;
};

/** Exclusive end of a prefix range: "ram" → "ran", so token >= start AND token < end. */
export function tokenRangeEnd(prefix: string): string {
  if (!prefix) return "\uffff";
  const chars = [...prefix];
  for (let i = chars.length - 1; i >= 0; i--) {
    const code = chars[i]!.codePointAt(0);
    if (code === undefined) continue;
    chars[i] = String.fromCodePoint(code + 1);
    return chars.slice(0, i + 1).join("");
  }
  return `${prefix}\uffff`;
}

/** Split a typed query into lowercase words (first word hits the index). */
export function searchWords(raw: string): string[] {
  // Strip a leading P- so "P-000412" becomes one code token, not ["p","000412"].
  const cleaned = raw.trim().toLowerCase().replace(/^p-/, "");
  return cleaned
    .split(/[\s,./+]+/)
    .map((w) => w.replace(/^p-/, ""))
    .filter((w) => w.length > 0);
}

export function buildSearchTokens(source: PatientTokenSource): SearchToken[] {
  const out: SearchToken[] = [];
  const seen = new Set<string>();

  const add = (token: string, kind: SearchTokenKind) => {
    const t = token.toLowerCase();
    if (!t) return;
    const key = `${kind}:${t}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ token: t, kind });
  };

  for (const word of patientNameWords(source.fullName)) add(word, "name");

  const code = source.code.trim().toLowerCase();
  if (code) {
    add(code, "code");
    const digits = code.replace(/\D/g, "");
    if (digits) {
      add(digits, "code");
      const stripped = digits.replace(/^0+/, "");
      if (stripped && stripped !== digits) add(stripped, "code");
    }
  }

  for (const mobile of [source.mobile, source.mobileSecondary]) {
    const ten = tenDigitsFromStored(mobile);
    if (!ten) continue;
    add(ten, "mobile");
    add([...ten].reverse().join(""), "mobile_rev");
  }

  const legacy = source.legacyRef?.trim();
  if (legacy) add(legacy, "legacy");

  return out;
}

/** Name words for search tokens and duplicate checks (2.1.6 / 2.1.7). */
export function patientNameWords(fullName: string): string[] {
  return fullName
    .toLowerCase()
    .split(/[\s.]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 0 && !HONORIFICS.has(w));
}

/** Ten national digits from a stored +91… mobile (or null). */
export function tenDigitsFromStored(stored: string | null): string | null {
  if (!stored) return null;
  const digits = stored.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return null;
}
