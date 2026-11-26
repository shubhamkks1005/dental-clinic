import {
  isSetUsable,
  medicineSnapshot,
  resolveSetMedicines,
  type ListItem,
  type PrescriptionItemInput,
} from "@clinic/shared";
import type { PrescriptionDto } from "./api";

export type DraftLine = PrescriptionItemInput & { key: string };

export function toLines(rx: PrescriptionDto): DraftLine[] {
  return rx.items.map((item, i) => ({
    key: item.id || `k-${i}`,
    medicineId: item.medicineId,
    genericName: item.genericName,
    brand: item.brand,
    form: item.form,
    strength: item.strength,
    dose: item.dose,
    frequency: item.frequency,
    days: item.days,
    timing: item.timing,
    instruction: item.instruction,
    tags: item.tags,
  }));
}

export function asItems(lines: DraftLine[]): PrescriptionItemInput[] {
  return lines.map((line) => {
    const item: Partial<DraftLine> = { ...line };
    delete item.key;
    return item as PrescriptionItemInput;
  });
}

/** A new prescription line from a Library medicine (its usual dose, frequency, days, timing). */
export function lineFromMedicine(item: ListItem, key: string): DraftLine {
  return { key, ...medicineSnapshot(item) };
}

/**
 * Library Q6 / Q12: the lines a medicine set adds, matched by id (older sets by name among active
 * medicines). A set with a hidden or missing medicine adds nothing: it is not offered in visits.
 */
export function linesOfSet(
  set: ListItem,
  medicines: readonly ListItem[],
  stamp: number,
): DraftLine[] {
  if (!isSetUsable(set, medicines)) return [];
  return resolveSetMedicines(set, medicines).flatMap((r, i) =>
    r.medicine ? [lineFromMedicine(r.medicine, `new-${stamp}-${i}`)] : [],
  );
}
