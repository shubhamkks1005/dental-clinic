import {
  PATIENT_LIST_SORTABLE,
  type DuplicateHit,
  type PatientListRow,
  type Repos,
} from "@clinic/db";
import {
  istDate,
  parseDuplicateCheck,
  parsePageQuery,
  type Page,
  type ParamReader,
} from "@clinic/shared";

// Patients list (1.1.7 seed visibility; filters/polish in 2.2.5).
export function listPatients(repos: Repos, params: ParamReader): Promise<Page<PatientListRow>> {
  const query = parsePageQuery(params, PATIENT_LIST_SORTABLE);
  return repos.patients.list(query);
}

// 2.1.7: soft duplicate warnings for the new-patient form (never blocks save).
export async function checkPatientDuplicates(
  repos: Repos,
  body: unknown,
  now: Date = new Date(),
): Promise<{ ok: true; warnings: DuplicateHit[] } | { ok: false; message: string }> {
  const parsed = parseDuplicateCheck(body);
  if (!parsed.ok) return parsed;
  const warnings = await repos.patientDuplicates.findWarnings({
    fullName: parsed.value.fullName,
    mobile: parsed.value.mobile,
    mobileSecondary: parsed.value.mobileSecondary,
    dateOfBirth: parsed.value.dateOfBirth,
    ageYearsAtReg: parsed.value.ageYearsAtReg,
    onDate: istDate(now),
  });
  return { ok: true, warnings };
}
