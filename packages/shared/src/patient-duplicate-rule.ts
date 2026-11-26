import { normaliseMobile } from "./mobile";
import { patientNameWords } from "./patient-search-tokens";

// THE duplicate-patient rule (owner 2026-11-26, Q5). A warning only: saving is never blocked,
// because one mobile is often shared by a whole family.
//   first_name_mobile: same first name word (case, spaces, dots, "Mr/Mrs" ignored) AND a mobile matches.
//   mobile_only:       a mobile matches but the first name does not.
export type DuplicateReason = "first_name_mobile" | "mobile_only";

export type DuplicatePerson = {
  fullName: string;
  mobile: string | null;
  mobileSecondary: string | null;
};

/** Strongest first; the caller sorts hits by this and never cuts a first_name_mobile hit. */
export const DUPLICATE_REASON_RANK: Record<DuplicateReason, number> = {
  first_name_mobile: 0,
  mobile_only: 1,
};

export function firstNameWord(fullName: string): string | null {
  return patientNameWords(fullName)[0] ?? null;
}

function mobilesOf(p: DuplicatePerson): string[] {
  const out: string[] = [];
  for (const raw of [p.mobile, p.mobileSecondary]) {
    const m = raw ? normaliseMobile(raw) : null;
    if (m) out.push(m);
  }
  return out;
}

export function duplicateReason(
  probe: DuplicatePerson,
  row: DuplicatePerson,
): DuplicateReason | null {
  const rowMobiles = new Set(mobilesOf(row));
  const mobileTouch = mobilesOf(probe).some((m) => rowMobiles.has(m));
  if (!mobileTouch) return null;
  const a = firstNameWord(probe.fullName);
  const b = firstNameWord(row.fullName);
  return a != null && a === b ? "first_name_mobile" : "mobile_only";
}
