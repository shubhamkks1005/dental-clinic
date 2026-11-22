import type { MedicalHistoryItem } from "@clinic/shared";

/** Summarise answer changes between two medical_history versions (3.5.13). */
export function summariseMedicalChange(prevJson: string | null, nextJson: string): string {
  const next = parseItems(nextJson);
  if (!prevJson) {
    const yes = next.filter((i) => i.answer === "yes").map((i) => i.label);
    if (yes.length === 0) return "Medical history recorded";
    return `Medical history recorded · ${yes.slice(0, 3).join(", ")}`;
  }
  const prev = parseItems(prevJson);
  const prevMap = new Map(prev.map((i) => [i.code, i]));
  const changes: string[] = [];
  for (const item of next) {
    const old = prevMap.get(item.code);
    if (!old) {
      changes.push(`${item.label}: ${item.answer}`);
      continue;
    }
    if (old.answer !== item.answer) {
      changes.push(`${item.label}: ${old.answer}→${item.answer}`);
    } else if ((old.note ?? "") !== (item.note ?? "") && item.note) {
      changes.push(`${item.label}: note updated`);
    }
  }
  if (changes.length === 0) return "Medical history reviewed (no change)";
  return changes.slice(0, 4).join("; ");
}

function parseItems(raw: string): MedicalHistoryItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is MedicalHistoryItem =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as MedicalHistoryItem).code === "string" &&
        typeof (row as MedicalHistoryItem).label === "string" &&
        typeof (row as MedicalHistoryItem).answer === "string",
    );
  } catch {
    return [];
  }
}
