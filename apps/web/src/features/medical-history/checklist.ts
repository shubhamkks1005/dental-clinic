import type { ListItem, MedicalAnswer, MedicalHistoryItem } from "@clinic/shared";

export type ChecklistRow = {
  code: string;
  label: string;
  section: string;
  alertLabel: string | null;
  restricted: boolean;
};

const CURRENT_MEDICINES_CODE = "current_medicines";

export function rowsFromHistoryItems(items: ListItem[]): ChecklistRow[] {
  return items
    .filter((i) => i.active)
    .map((i) => {
      const code = typeof i.data.code === "string" ? i.data.code : i.id;
      const section = typeof i.data.section === "string" ? i.data.section : "conditions";
      const alertLabel =
        typeof i.data.alert_label === "string" && i.data.alert_label.trim()
          ? i.data.alert_label.trim()
          : null;
      const restricted =
        typeof i.data.restricted === "string" && i.data.restricted.toLowerCase() === "yes";
      return { code, label: i.label, section, alertLabel, restricted };
    });
}

export function allergyRows(allergens: ListItem[]): ChecklistRow[] {
  return allergens
    .filter((i) => i.active)
    .map((i) => ({
      code: `allergy:${i.id}`,
      label: i.label,
      section: "allergies",
      alertLabel: `${i.label} allergy`,
      restricted: false,
    }));
}

export function answerMap(
  items: MedicalHistoryItem[] | undefined,
): Map<string, MedicalHistoryItem> {
  const map = new Map<string, MedicalHistoryItem>();
  for (const item of items ?? []) map.set(item.code, item);
  return map;
}

export function medicinesNote(items: MedicalHistoryItem[] | undefined): string {
  return answerMap(items).get(CURRENT_MEDICINES_CODE)?.note?.trim() ?? "";
}

export function buildSaveItems(
  rows: ChecklistRow[],
  answers: Record<string, MedicalAnswer>,
  notes: Record<string, string>,
  medicinesText: string,
): MedicalHistoryItem[] {
  const items: MedicalHistoryItem[] = rows.map((row) => {
    const answer = answers[row.code] ?? "unknown";
    const note = notes[row.code]?.trim() || null;
    return {
      code: row.code,
      label: row.label,
      answer,
      note,
      restricted: row.restricted || undefined,
      alertLabel: answer === "yes" ? row.alertLabel : null,
    };
  });
  const text = medicinesText.trim();
  if (text) {
    items.push({
      code: CURRENT_MEDICINES_CODE,
      label: "Current medicines",
      answer: "yes",
      note: text,
      alertLabel: null,
    });
  }
  return items;
}

export { CURRENT_MEDICINES_CODE };
