import type { Page, PageQuery } from "@clinic/shared";
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

export function listPatients(query: PageQuery): Promise<Page<PatientListRow>> {
  const params = new URLSearchParams(pageQueryParams(query));
  return api<{ page: Page<PatientListRow> }>(`/api/staff/patients?${params}`).then((r) => r.page);
}
