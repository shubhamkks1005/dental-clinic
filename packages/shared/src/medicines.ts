import type { ListItemData } from "./lists";
import { MEDICINE_TIMING_LABEL } from "./prescriptions";

/** Snapshot copied onto a prescription item so later list edits never rewrite old Rx (4.1.3). */
export type MedicineSnapshot = {
  medicineId: string;
  genericName: string;
  brand: string;
  form: string;
  strength: string;
  dose: string;
  frequency: string;
  days: string;
  timing: string;
  instruction: string;
  tags: string;
};

export function medicineSnapshot(
  item: { id: string; label: string; data: ListItemData },
  overrides?: Partial<
    Pick<MedicineSnapshot, "dose" | "frequency" | "days" | "timing" | "instruction">
  >,
): MedicineSnapshot {
  const d = item.data;
  const text = (key: string) => (typeof d[key] === "string" ? d[key] : "");
  return {
    medicineId: item.id,
    genericName: item.label,
    brand: text("brand"),
    form: text("form"),
    strength: text("strength"),
    dose: overrides?.dose ?? text("default_dose"),
    frequency: overrides?.frequency ?? text("default_frequency"),
    days: overrides?.days ?? text("default_days"),
    timing: overrides?.timing ?? text("timing"),
    instruction: overrides?.instruction ?? text("instruction"),
    tags: text("tags"),
  };
}

/** 4.1.4: split medicine / allergen tag strings (space or comma separated). */
export function parseMedicineTags(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/** True when a medicine tag matches an allergen tag (case-insensitive). */
export function medicineMatchesAllergen(
  medicineTags: string | undefined | null,
  allergenTag: string | undefined | null,
): boolean {
  const want = allergenTag?.trim().toLowerCase();
  if (!want) return false;
  return parseMedicineTags(medicineTags).includes(want);
}

/** 4.1.5: pipe-separated generic names on a medicine set. */
export function parseMedicineSetItems(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Saved in place of an empty usual dose, frequency, days or timing (Library Q8). */
export const AS_DIRECTED = "As directed";

const AS_DIRECTED_FIELDS = ["default_dose", "default_frequency", "default_days", "timing"] as const;

/**
 * Fills ONLY the usual dose, frequency, days and timing with "As directed" when empty. Form and
 * strength stay blank; nothing else is invented (no "-", no "5 days", no category).
 */
export function fillAsDirected(data: ListItemData): ListItemData {
  const out: ListItemData = { ...data };
  for (const key of AS_DIRECTED_FIELDS) {
    const v = out[key];
    if (typeof v !== "number" && !(v ?? "").trim()) out[key] = AS_DIRECTED;
  }
  return out;
}

/** Library food timing choices (Q10): blank means "As directed". */
export const LIBRARY_FOOD_TIMINGS = ["after_food", "before_food"] as const;

/** The words for a stored timing; older free text is shown as stored. */
export function foodTimingWord(value: string | number | undefined | null): string {
  const v = String(value ?? "").trim();
  if (!v || v === AS_DIRECTED) return AS_DIRECTED;
  return (MEDICINE_TIMING_LABEL as Record<string, string>)[v] ?? v;
}

/** One key per dosage form, so "Tab" and "Tablet" filter together (L15). */
export const MEDICINE_FORM_WORD: Record<string, string> = {
  tablet: "Tablet",
  capsule: "Capsule",
  syrup: "Syrup",
  gel: "Gel",
  mouthwash: "Mouthwash",
  drops: "Drops",
  other: "Other",
};

const FORM_ALIASES: Record<string, string> = {
  tab: "tablet",
  tabs: "tablet",
  cap: "capsule",
  caps: "capsule",
  syp: "syrup",
  drop: "drops",
};

export function medicineFormKey(form: string | number | undefined | null): string {
  const v = String(form ?? "")
    .trim()
    .toLowerCase();
  return FORM_ALIASES[v] ?? v;
}

export type CategoryTint = "info" | "warning" | "secondary" | "success" | "neutral";

/** Card tint for a medicine category; free text, so case-insensitive; empty is neutral (L23). */
export function categoryTint(category: string | number | undefined | null): CategoryTint {
  const v = String(category ?? "")
    .trim()
    .toLowerCase();
  if (!v) return "neutral";
  if (v === "antibiotic") return "info";
  if (v === "analgesic") return "warning";
  if (v === "antacid") return "secondary";
  return "success";
}
