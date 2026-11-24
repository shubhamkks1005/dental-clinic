import type { PrescriptionItemInput } from "@clinic/shared";
import { api } from "../../api/client";

export type PrescriptionDto = {
  id: string;
  patientId: string;
  visitId: string | null;
  doctorId: string;
  weightKg: number | null;
  advice: string | null;
  followUpOn: string | null;
  status: "draft" | "issued" | "revised";
  rxNo: string | null;
  version: number;
  items: Array<{
    id: string;
    medicineId: string | null;
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
    sortOrder: number;
  }>;
};

export async function listVisitPrescriptions(visitId: string): Promise<PrescriptionDto[]> {
  const res = await api<{ prescriptions: PrescriptionDto[] }>(
    `/api/staff/visits/${visitId}/prescriptions`,
  );
  return res.prescriptions;
}

export type DraftPrescription = {
  id: string;
  visitId: string | null;
  patientId: string;
  patientName: string;
  visitDateLocal: string | null;
};

/** Prescriptions started but not issued (the doctor's "Waiting for you" on Today). */
export async function listDraftPrescriptions(): Promise<DraftPrescription[]> {
  const res = await api<{ drafts: DraftPrescription[] }>("/api/staff/prescriptions/drafts");
  return res.drafts;
}

export async function createPrescription(body: {
  patientId: string;
  visitId?: string | null;
  items?: PrescriptionItemInput[];
  advice?: string;
}): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>("/api/staff/prescriptions", {
    method: "POST",
    body: {
      dentistDispensed: false,
      dentistDispensedNote: "",
      advice: body.advice ?? "",
      ...body,
    },
  });
  return res.prescription;
}

export async function replaceItems(
  id: string,
  version: number,
  items: PrescriptionItemInput[],
): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(`/api/staff/prescriptions/${id}/items`, {
    method: "PUT",
    body: { version, items },
  });
  return res.prescription;
}

export async function patchPrescription(
  id: string,
  body: Record<string, unknown>,
): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(`/api/staff/prescriptions/${id}`, {
    method: "PATCH",
    body: body,
  });
  return res.prescription;
}

export async function issuePrescription(id: string, version: number): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(`/api/staff/prescriptions/${id}/issue`, {
    method: "POST",
    body: { version },
  });
  return res.prescription;
}

export async function revisePrescription(id: string): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(
    `/api/staff/prescriptions/${id}/revise`,
    { method: "POST", body: "{}" },
  );
  return res.prescription;
}

export async function copyPreviousPrescription(
  patientId: string,
  visitId?: string | null,
): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(
    "/api/staff/prescriptions/copy-previous",
    {
      method: "POST",
      body: { patientId, visitId: visitId ?? null },
    },
  );
  return res.prescription;
}

export async function getPrescription(id: string): Promise<PrescriptionDto> {
  const res = await api<{ prescription: PrescriptionDto }>(`/api/staff/prescriptions/${id}`);
  return res.prescription;
}
