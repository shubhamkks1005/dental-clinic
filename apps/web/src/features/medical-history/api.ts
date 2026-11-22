import type { MedicalHistoryItem } from "@clinic/shared";
import { api } from "../../api/client";

export type MedicalHistoryVersion = {
  id: string;
  patientId: string;
  versionNo: number;
  items: MedicalHistoryItem[];
  recordedAt: string;
  recordedBy: string;
};

export type AlertRow = {
  id: string;
  code: string;
  label: string;
  restricted: boolean;
  active: boolean;
};

export type AlertFlags = { hasAlert: boolean; hasRestricted: boolean };

export function getMedicalHistory(patientId: string) {
  return api<{ history: MedicalHistoryVersion | null; alerts: AlertRow[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/medical-history`,
  );
}

export function saveMedicalHistory(patientId: string, items: MedicalHistoryItem[]) {
  return api<{ history: MedicalHistoryVersion; alerts: AlertRow[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/medical-history`,
    { method: "POST", body: { items } },
  );
}

export function getAlertFlags(patientId: string) {
  return api<{ flags: AlertFlags }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/alert-flags`,
  );
}
