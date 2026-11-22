import type { Repos } from "@clinic/db";
import {
  parseAddVisitAddendum,
  parseAddVisitDiagnosis,
  parseAddVisitProcedure,
  parseFinaliseVisit,
  parseOpenVisit,
  parsePatchVisit,
} from "@clinic/shared";

export async function openVisit(repos: Repos, body: unknown) {
  const parsed = parseOpenVisit(body);
  if (!parsed.ok) return parsed;
  const visit = await repos.visits.open(parsed.value);
  return { ok: true as const, visit };
}

export async function getVisit(repos: Repos, id: string) {
  const visit = await repos.visits.getById(id);
  const [diagnoses, procedures, addenda] = await Promise.all([
    repos.visitDiagnoses.listForVisit(id),
    repos.visitProcedures.listForVisit(id),
    repos.visits.listAddenda(id),
  ]);
  return { ok: true as const, visit: { ...visit, diagnoses, procedures, addenda } };
}

export async function listRecentVisits(repos: Repos, patientId: string, limit: number | undefined) {
  const visits = await repos.visits.listRecentByPatient(patientId, { limit });
  return { ok: true as const, visits };
}

export async function patchVisit(repos: Repos, id: string, body: unknown) {
  const parsed = parsePatchVisit(body);
  if (!parsed.ok) return parsed;
  const { version, ...fields } = parsed.value;
  const visit = await repos.visits.updateDraftFields(id, version, fields);
  const [diagnoses, procedures, addenda] = await Promise.all([
    repos.visitDiagnoses.listForVisit(id),
    repos.visitProcedures.listForVisit(id),
    repos.visits.listAddenda(id),
  ]);
  return { ok: true as const, visit: { ...visit, diagnoses, procedures, addenda } };
}

export async function addVisitDiagnosis(repos: Repos, visitId: string, body: unknown) {
  const parsed = parseAddVisitDiagnosis(body);
  if (!parsed.ok) return parsed;
  const diagnosis = await repos.visitDiagnoses.add({
    visitId,
    listItemId: parsed.value.listItemId,
    freeText: parsed.value.freeText,
    toothFdi: parsed.value.toothFdi,
  });
  return { ok: true as const, diagnosis };
}

export async function addVisitProcedure(repos: Repos, visitId: string, body: unknown) {
  const parsed = parseAddVisitProcedure(body);
  if (!parsed.ok) return parsed;
  const procedure = await repos.visitProcedures.add({
    visitId,
    listItemId: parsed.value.listItemId,
    toothFdi: parsed.value.toothFdi,
    surfaces: parsed.value.surfaces,
    note: parsed.value.note,
  });
  return { ok: true as const, procedure };
}

export async function finaliseVisit(repos: Repos, id: string, body: unknown) {
  const parsed = parseFinaliseVisit(body);
  if (!parsed.ok) return parsed;
  const visit = await repos.visits.finalise(id, parsed.value);
  return { ok: true as const, visit };
}

export async function addVisitAddendum(repos: Repos, id: string, body: unknown) {
  const parsed = parseAddVisitAddendum(body);
  if (!parsed.ok) return parsed;
  const addendum = await repos.visits.addAddendum(id, parsed.value);
  return { ok: true as const, addendum };
}
