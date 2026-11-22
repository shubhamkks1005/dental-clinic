import type { VisitPatchBody } from "./api";

export const AUTOSAVE_DEBOUNCE_MS = 1500;
export const AUTOSAVE_MIN_INTERVAL_MS = 5000;

export type SaveStatus = "saved" | "saving" | "dirty" | "error";

export type NotesSnapshot = {
  chiefComplaint: string;
  historyNote: string;
  examNote: string;
  gumCondition: string;
  advice: string;
  nextVisitNote: string;
  bpSystolic: string;
  bpDiastolic: string;
  pulse: string;
};

function intOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function normText(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}

/** Build a patch of only the fields that differ from the last saved snapshot. */
export function diffVisitNotes(
  version: number,
  current: NotesSnapshot,
  saved: NotesSnapshot,
): VisitPatchBody | null {
  const patch: VisitPatchBody = { version };
  let changed = false;

  const textKeys = [
    "chiefComplaint",
    "historyNote",
    "examNote",
    "gumCondition",
    "advice",
    "nextVisitNote",
  ] as const;
  for (const key of textKeys) {
    const next = normText(current[key]);
    const prev = normText(saved[key]);
    if (next !== prev) {
      patch[key] = next;
      changed = true;
    }
  }

  const vitals = [
    ["bpSystolic", current.bpSystolic, saved.bpSystolic],
    ["bpDiastolic", current.bpDiastolic, saved.bpDiastolic],
    ["pulse", current.pulse, saved.pulse],
  ] as const;
  for (const [key, cur, prev] of vitals) {
    const next = intOrNull(cur);
    const before = intOrNull(prev);
    if (next !== before) {
      patch[key] = next;
      changed = true;
    }
  }

  return changed ? patch : null;
}

export function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case "saved":
      return "Saved";
    case "saving":
      return "Saving…";
    case "dirty":
      return "Not saved";
    case "error":
      return "Not saved — retrying";
  }
}
