import { isFdiTooth, type ToothHistoryEntry } from "@clinic/shared";

// Words of the tooth card (design: renderZoomedCard). Pure, so they can be tested.

const QUADRANT = ["", "Upper right", "Upper left", "Lower left", "Lower right"] as const;
const PERMANENT = [
  "",
  "central incisor",
  "lateral incisor",
  "canine",
  "first premolar",
  "second premolar",
  "first molar",
  "second molar",
  "third molar",
] as const;
const PRIMARY = ["", "central incisor", "lateral incisor", "canine", "first molar", "second molar"];

/** 36 gives "Lower left first molar"; 54 gives "Baby upper right first molar". */
export function toothName(fdi: number): string {
  if (!isFdiTooth(fdi)) return `Tooth ${fdi}`;
  const q = Math.floor(fdi / 10);
  const pos = fdi % 10;
  if (q <= 4) return `${QUADRANT[q]} ${PERMANENT[pos]}`;
  const name = `${QUADRANT[q - 4]} ${PRIMARY[pos]}`;
  return `Baby ${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** An ISO instant to "22 Nov 2026" on the clinic day (IST), never the device clock. */
export function historyDate(iso: string): string {
  const ist = new Date(new Date(iso).getTime() + 5.5 * 3_600_000);
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
}

/** What one timeline row says, with the condition code turned into the list word. */
export function entryText(e: ToothHistoryEntry, conditionLabel: (code: string) => string): string {
  const surfaces =
    e.surfaces.length > 0 ? ` (${e.surfaces.map((s) => s.toUpperCase()).join(", ")})` : "";
  if (e.kind === "chart") return `${conditionLabel(e.title)} marked${surfaces}`;
  if (e.kind === "procedure") return `${e.title}${surfaces}`;
  return e.title;
}

/** The one-line history is the first two rows of the same timeline (no second request). */
export function oneLineHistory(
  entries: ToothHistoryEntry[],
  conditionLabel: (code: string) => string,
): string {
  if (entries.length === 0) return "No prior treatment recorded on this tooth.";
  return entries
    .slice(0, 2)
    .map((e) => `${historyDate(e.at)} — ${entryText(e, conditionLabel)}`)
    .join(" · ");
}
