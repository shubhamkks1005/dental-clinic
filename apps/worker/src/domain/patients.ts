import { PATIENT_LIST_SORTABLE, type PatientListRow, type Repos } from "@clinic/db";
import { parsePageQuery, type Page, type ParamReader } from "@clinic/shared";

// Patients list (1.1.7 seed visibility; filters/polish in 2.2.5).
export function listPatients(repos: Repos, params: ParamReader): Promise<Page<PatientListRow>> {
  const query = parsePageQuery(params, PATIENT_LIST_SORTABLE);
  return repos.patients.list(query);
}
