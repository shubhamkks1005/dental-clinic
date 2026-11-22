import {
  PATIENT_LIST_SORTABLE,
  type CreatedPatient,
  type DuplicateHit,
  type PatientDetail,
  type PatientListRow,
  type PatientListStatus,
  type Repos,
} from "@clinic/db";
import {
  istDate,
  parseCreatePatient,
  parseDuplicateCheck,
  parsePageQuery,
  parseUpdatePatient,
  parseVersionOnly,
  type Page,
  type ParamReader,
} from "@clinic/shared";

// Patients list (1.1.7 / 2.1.6 / 2.1.8).
export function listPatients(repos: Repos, params: ParamReader): Promise<Page<PatientListRow>> {
  const query = parsePageQuery(params, PATIENT_LIST_SORTABLE);
  const status = parseListStatus(params.get("status"));
  return repos.patients.list(query, { status });
}

// 2.2.2 profile.
export function getPatient(repos: Repos, id: string): Promise<PatientDetail> {
  return repos.patients.get(id);
}

// 2.2.4 edit (version-checked).
export async function updatePatient(
  repos: Repos,
  id: string,
  body: unknown,
  now: Date = new Date(),
): Promise<{ ok: true; patient: PatientDetail } | { ok: false; message: string }> {
  const existing = await repos.patients.get(id);
  const registeredOn = istDate(new Date(existing.createdAt));
  const parsed = parseUpdatePatient(body, istDate(now), registeredOn);
  if (!parsed.ok) return parsed;
  const patient = await repos.patients.update(id, parsed.value);
  return { ok: true, patient };
}

function parseListStatus(raw: string | null): PatientListStatus {
  if (raw === "archived" || raw === "all") return raw;
  return "active";
}

// 2.2.1: create patient (code + tokens + audit).
export async function createPatient(
  repos: Repos,
  body: unknown,
  now: Date = new Date(),
): Promise<{ ok: true; patient: CreatedPatient } | { ok: false; message: string }> {
  const parsed = parseCreatePatient(body, istDate(now));
  if (!parsed.ok) return parsed;
  const patient = await repos.patients.create(parsed.value);
  return { ok: true, patient };
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
    dateOfBirth: parsed.value.dateOfBirth ?? null,
    ageYearsAtReg: parsed.value.ageYearsAtReg ?? null,
    onDate: istDate(now),
  });
  return { ok: true, warnings };
}

// 2.1.8
export async function archivePatient(
  repos: Repos,
  id: string,
  body: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const version = parseVersionOnly(body);
  if (!version.ok) return { ok: false, message: version.message };
  const reason =
    typeof body === "object" && body !== null && "reason" in body
      ? String((body as { reason: unknown }).reason ?? "")
      : "";
  await repos.patients.archive(id, reason, version.value.version);
  return { ok: true };
}

export async function restorePatient(
  repos: Repos,
  id: string,
  body: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const version = parseVersionOnly(body);
  if (!version.ok) return { ok: false, message: version.message };
  await repos.patients.restore(id, version.value.version);
  return { ok: true };
}
