import type { PrescriptionItemInput } from "@clinic/shared";
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
