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
 * Which history entry types a role may receive from the feed API (3.5.14 / 4.2.8).
 * Prescription rows: doctor gets medicine names; receptionist gets rx number only (print).
 */
export function historyTypesForRole(role: Role): readonly HistoryEntryType[] {
  if (isAllowed(role, "clinical.view")) {
    return [
      "appointment",
      "visit",
      "treatment",
      "prescription",
      "certificate",
      "file",
      "medical_change",
      "consent",
      "amendment",
    ];
  }
  // Receptionist: no clinical notes/dx; issued Rx/certs listed for print only.
  const base: HistoryEntryType[] = ["appointment", "consent", "file"];
  if (isAllowed(role, "prescriptions.print")) base.push("prescription");
  if (isAllowed(role, "certificates.print")) base.push("certificate");
  return base;
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
