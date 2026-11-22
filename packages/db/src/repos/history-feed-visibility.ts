import type { FileKind, HistoryEntryType, Role } from "@clinic/shared";
import { isAllowed } from "../permissions";

/** Receptionist may see these file kinds in history (3.5.14 / 3.7.5). */
export const HISTORY_DOCUMENT_FILE_KINDS: readonly FileKind[] = ["scan", "consent"];

/** Hidden from receptionist even if type were somehow included. */
export const HISTORY_CLINICAL_ENTRY_TYPES: readonly HistoryEntryType[] = [
  "visit",
  "treatment",
  "medical_change",
  "amendment",
];

/**
 * Which history entry types a role may receive from the feed API (3.5.14).
 * Bills/prescriptions land in later stages; not listed until those modules exist.
 */
export function historyTypesForRole(role: Role): readonly HistoryEntryType[] {
  if (isAllowed(role, "clinical.view")) {
    return ["appointment", "visit", "treatment", "file", "medical_change", "consent", "amendment"];
  }
  // Receptionist (and any non-clinical role with patients.view): no clinical types.
  return ["appointment", "consent", "file"];
}

export function historyFileKindsForRole(role: Role): readonly FileKind[] | null {
  if (isAllowed(role, "files.clinical")) return null; // all kinds
  if (isAllowed(role, "files.documents")) return HISTORY_DOCUMENT_FILE_KINDS;
  return [];
}

/** Guard used in tests / defence in depth after merge. */
export function isHistoryEntryVisible(
  role: Role,
  entry: { type: HistoryEntryType; status: string | null },
): boolean {
  const allowed = historyTypesForRole(role);
  if (!allowed.includes(entry.type)) return false;
  if (entry.type === "file") {
    const kinds = historyFileKindsForRole(role);
    if (kinds === null) return true;
    if (!entry.status) return false;
    return (kinds as readonly string[]).includes(entry.status);
  }
  return true;
}
