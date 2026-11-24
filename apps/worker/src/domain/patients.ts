import {
  PATIENT_LIST_SORTABLE,
  type CreatedPatient,
  type DuplicateHit,
  type PatientDetail,
  type PatientListFilter,
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

/** A list row plus what the patient still owes (Q2.6). */
export type PatientListItem = PatientListRow & { duePaise: number };

/** The Balance due filter looks at the biggest dues first; D1 allows 100 values per query. */
const BALANCE_DUE_MAX = 90;

// Patients list (1.1.7 / 2.1.6 / 2.1.8 / 2.2.5 filters, Q2.6 last visit, next appointment, due).
export async function listPatients(
  repos: Repos,
  params: ParamReader,
): Promise<Page<PatientListItem>> {
  const query = parsePageQuery(params, PATIENT_LIST_SORTABLE);
  const status = parseListStatus(params.get("status"));
  const raw = params.get("filter");
  const filter = raw === "new_month" || raw === "inactive_6m" ? (raw as PatientListFilter) : null;
  let onlyIds: string[] | undefined;
  if (raw === "balance_due") {
    const dues = await repos.bills.listDues();
    onlyIds = [...dues.rows]
      .sort((a, b) => b.duePaise - a.duePaise)
      .slice(0, BALANCE_DUE_MAX)
      .map((r) => r.patientId);
    if (onlyIds.length === 0)
      return { rows: [], total: 0, page: query.page, pageSize: query.pageSize };
  }
  const now = new Date();
  const page = await repos.patients.listPage(query, { status, filter, onlyIds, now });
  const ids = page.rows.map((r) => r.id);
  // Last visit, next appointment and dues all need only the page ids: ask for them together.
  const [extra, dues] = await Promise.all([
    repos.patients.visitAndNext(ids, now),
    duesForPage(repos, ids),
  ]);
  return {
    ...page,
    rows: page.rows.map((r) => ({
      ...r,
      lastVisitOn: extra.last.get(r.id) ?? null,
      nextAppointment: extra.next.get(r.id) ?? null,
      duePaise: dues.get(r.id) ?? 0,
    })),
  };
}

// D1 allows 100 bound values per query: chunks of 40, all chunks together.
async function duesForPage(repos: Repos, ids: string[]): Promise<Map<string, number>> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 40) chunks.push(ids.slice(i, i + 40));
  const maps = await Promise.all(chunks.map((c) => repos.bills.duesForPatients(c)));
  return new Map(maps.flatMap((m) => [...m]));
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

// 2.2.1 / 2.2.7: create patient (code + tokens + audit); optional registration consents.
export async function createPatient(
  repos: Repos,
  body: unknown,
  now: Date = new Date(),
): Promise<{ ok: true; patient: CreatedPatient } | { ok: false; message: string }> {
  const parsed = parseCreatePatient(body, istDate(now));
  if (!parsed.ok) return parsed;
  const patient = await repos.patients.create(parsed.value);
  await recordRegistrationConsents(repos, patient.id, parsed.value.consents, now);
  return { ok: true, patient };
}

async function recordRegistrationConsents(
  repos: Repos,
  patientId: string,
  consents: { noticeShown: boolean; smsReminders: boolean; marketing: boolean },
  now: Date,
): Promise<void> {
  const noticeVersion = Number((await repos.settings.get("privacy_notice.version")).value);
  if (!Number.isInteger(noticeVersion) || noticeVersion < 1) return;
  const givenAt = now.toISOString();
  const rows: Array<{
    type: "privacy_notice" | "sms_reminders" | "marketing";
    given: boolean;
  }> = [];
  if (consents.noticeShown) rows.push({ type: "privacy_notice", given: true });
  if (consents.smsReminders) rows.push({ type: "sms_reminders", given: true });
  if (consents.marketing) rows.push({ type: "marketing", given: true });
  for (const row of rows) {
    await repos.consents.record(patientId, {
      type: row.type,
      noticeVersion,
      given: row.given,
      method: "form",
      givenAt,
    });
  }
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
