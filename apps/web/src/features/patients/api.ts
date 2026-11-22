import type { ConsentRow, Page, PageQuery } from "@clinic/shared";
import { pageQueryParams } from "@clinic/shared";
import { api } from "../../api/client";

export type PatientListRow = {
  id: string;
  code: string;
  fullName: string;
  gender: "female" | "male" | "other";
  ageYearsAtReg: number | null;
  dateOfBirth: string | null;
  createdAt: string;
  mobile: string | null;
  status: "active" | "archived";
};

export type CreatedPatient = {
  id: string;
  code: string;
  fullName: string;
  gender: "female" | "male" | "other";
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  mobile: string | null;
  status: "active";
  version: number;
};

export type DuplicateWarning = {
  id: string;
  code: string;
  fullName: string;
  mobile: string | null;
  reason: "mobile_name" | "name_age" | "secondary_mobile";
};

export function listPatients(query: PageQuery): Promise<Page<PatientListRow>> {
  const params = new URLSearchParams(pageQueryParams(query));
  return api<{ page: Page<PatientListRow> }>(`/api/staff/patients?${params}`).then((r) => r.page);
}

export function getPatientConsents(patientId: string): Promise<ConsentRow[]> {
  return api<{ consents: ConsentRow[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/consents`,
  ).then((r) => r.consents);
}

export function createPatient(body: Record<string, unknown>): Promise<CreatedPatient> {
  return api<{ patient: CreatedPatient }>("/api/staff/patients", {
    method: "POST",
    body,
  }).then((r) => r.patient);
}

export function checkPatientDuplicates(body: Record<string, unknown>): Promise<DuplicateWarning[]> {
  return api<{ warnings: DuplicateWarning[] }>("/api/staff/patients/duplicate-check", {
    method: "POST",
    body,
  }).then((r) => r.warnings);
}
