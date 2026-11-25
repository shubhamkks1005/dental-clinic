import type { ToothHistoryEntry } from "@clinic/shared";
import { api } from "../../api/client";

export type ToothHistoryData = {
  toothFdi: number;
  teeth: number[];
  entries: ToothHistoryEntry[];
  next: string | null;
  plan: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
  }[];
  note: { id: string; body: string; version: number; updatedAt: string } | null;
  /** Baby tooth only: the permanent tooth that replaces it, when that one has a record. */
  permanentTooth: number | null;
};

export function getToothHistory(patientId: string, fdi: number, before?: string | null) {
  const q = before ? `?before=${encodeURIComponent(before)}` : "";
  return api<ToothHistoryData>(`/api/staff/patients/${patientId}/teeth/${fdi}/history${q}`);
}

/** Save, change or clear (empty text) the doctor's note on one tooth. */
export function saveToothNote(
  patientId: string,
  fdi: number,
  body: { visitId: string; body: string; version?: number | null },
) {
  return api<{ note: { id: string; body: string; version: number; updatedAt: string } | null }>(
    `/api/staff/patients/${patientId}/teeth/${fdi}/note`,
    { method: "PUT", body },
  );
}
