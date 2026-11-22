import type { ListItemData } from "./lists";

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
