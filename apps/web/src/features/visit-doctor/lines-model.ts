import { isFdiTooth, isToothSurface, type ListItem, type ToothSurface } from "@clinic/shared";
import type { PagePlanItem } from "./page-api";

// Pure rules of the diagnosis and procedure section (design: doctor_visit.html, Accordion 2).
// No fees are shown on this screen (owner decision Q11); only the words "No fee set" (Q12).

export type SearchOption = {
  id: string;
  label: string;
  code: string;
  /** How often this name was used in the last 30 days. */
  uses: number;
  /** Procedures only: the usual fee in paise, null when none is set. */
  paise: number | null;
};

export const MAX_OPTIONS = 8;

function toOption(item: ListItem, usage: Record<string, number>): SearchOption {
  const fee = item.data.default_paise;
  const code = item.data.code;
  return {
    id: item.id,
    label: item.label,
    code: typeof code === "string" ? code : "",
    uses: usage[item.label.toLowerCase()] ?? 0,
    paise: typeof fee === "number" && fee > 0 ? fee : null,
  };
}

export const searchOptions = (list: ListItem[], usage: Record<string, number>): SearchOption[] =>
  list.filter((i) => i.active).map((i) => toOption(i, usage));

/**
 * Empty box: the popular ones (used before, most used first), or the first of the list when nothing
 * is popular yet. Typing: names or codes that contain the text, names that start with it first.
 */
export function filterOptions(options: SearchOption[], text: string, max = MAX_OPTIONS) {
  const q = text.trim().toLowerCase();
  if (!q) {
    const popular = options.filter((o) => o.uses > 0).sort((a, b) => b.uses - a.uses);
    return (popular.length > 0 ? popular : options).slice(0, max);
  }
  const hits = options.filter(
    (o) => o.label.toLowerCase().includes(q) || (o.code !== "" && o.code.toLowerCase().includes(q)),
  );
  const rank = (o: SearchOption) => (o.label.toLowerCase().startsWith(q) ? 0 : 1);
  return hits.sort((a, b) => rank(a) - rank(b) || b.uses - a.uses).slice(0, max);
}

/** "36" gives 36, empty gives null (no tooth), anything that is not an FDI number is refused. */
export function parseToothText(text: string): { ok: true; fdi: number | null } | { ok: false } {
  const t = text.trim();
  if (t === "") return { ok: true, fdi: null };
  if (!/^\d{2}$/.test(t)) return { ok: false };
  const n = Number(t);
  return isFdiTooth(n) ? { ok: true, fdi: n } : { ok: false };
}

export const TOOTH_HINT = "Use an FDI tooth number (11 to 48, 51 to 85) or leave it empty.";

export const SURFACE_BUTTONS = ["o", "m", "d", "b", "l"] as const satisfies readonly ToothSurface[];

export function parseSurfaces(json: string): ToothSurface[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v)
      ? v.filter((s): s is ToothSurface => typeof s === "string" && isToothSurface(s))
      : [];
  } catch {
    return [];
  }
}

export function toggleSurface(list: ToothSurface[], s: ToothSurface): ToothSurface[] {
  return list.includes(s) ? list.filter((x) => x !== s) : [...list, s];
}

/** The same procedure twice on the same tooth: a notice, never a block. */
export function hasDuplicateProcedure(
  lines: { label: string; toothFdi: number | null }[],
): boolean {
  const seen = new Set<string>();
  for (const l of lines) {
    if (l.toothFdi === null) continue;
    const key = `${l.label.toLowerCase()}::${l.toothFdi}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

/** "From plan: RCT sitting 2 of 3" when an open plan item has the same name and tooth. */
export function planTag(
  line: { label: string; toothFdi: number | null },
  plan: PagePlanItem[],
): string | null {
  if (line.toothFdi === null) return null;
  const hit = plan.find(
    (p) =>
      p.toothFdi === line.toothFdi && p.procedureLabel.toLowerCase() === line.label.toLowerCase(),
  );
  if (!hit) return null;
  return hit.sittings > 1
    ? `From plan: ${hit.procedureLabel} sitting ${Math.min(hit.sittingsDone + 1, hit.sittings)} of ${hit.sittings}`
    : `From plan: ${hit.procedureLabel}`;
}

/** Summary of the accordion: counts only, no money. */
export function summaryText(diagnoses: number, procedures: number): string {
  const d = `${diagnoses} ${diagnoses === 1 ? "diagnosis" : "diagnoses"}`;
  const p = `${procedures} ${procedures === 1 ? "procedure" : "procedures"}`;
  return `${d} · ${p}`;
}

/** "Done" means at least one line, or the doctor chose "none" (stored on the visit). */
export function doneStates(v: {
  diagnoses: number;
  procedures: number;
  noDiagnosis: boolean;
  noProcedure: boolean;
}) {
  return {
    diagnosis: v.diagnoses > 0 || v.noDiagnosis,
    procedure: v.procedures > 0 || v.noProcedure,
  };
}

/** Whole rupees or rupees with paise ("1200", "1200.50") to paise; anything else is null. */
export function rupeesToPaise(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(t)) return null;
  const paise = Math.round(Number(t) * 100);
  return paise > 0 && paise <= 10_000_000 ? paise : null;
}
