import type { Repos } from "@clinic/db";
import { parseAddToothEvent, parseAddToothEventsBatch, parseSaveToothNote } from "@clinic/shared";

export async function getPatientChart(
  repos: Repos,
  patientId: string,
  asOfVisitId: string | null,
  highlightVisitId: string | null,
) {
  const chart = await repos.toothEvents.chartForPatient(patientId, {
    asOfVisitId,
    highlightVisitId,
  });
  return { ok: true as const, chart };
}

export async function addPatientToothEvent(repos: Repos, patientId: string, body: unknown) {
  const parsed = parseAddToothEvent(body);
  if (!parsed.ok) return parsed;
  const { id } = await repos.toothEvents.add({
    patientId,
    visitId: parsed.value.visitId,
    toothFdi: parsed.value.toothFdi,
    surface: parsed.value.surface,
    conditionCode: parsed.value.conditionCode,
  });
  const chart = await repos.toothEvents.chartForPatient(patientId, {
    highlightVisitId: parsed.value.visitId,
  });
  return { ok: true as const, eventId: id, chart };
}

// B7: save, change or clear (empty text) the doctor's note on one tooth.
export async function saveToothNote(repos: Repos, patientId: string, fdi: string, body: unknown) {
  const parsed = parseSaveToothNote(body);
  if (!parsed.ok) return parsed;
  // The repo checks the permission first, then the tooth number (a bad one is a 400 there).
  const note = await repos.toothNotes.save(patientId, Number(fdi), parsed.value);
  return { ok: true as const, note };
}

// B9: save a group of chart marks in one request; the reply carries the fresh chart.
export async function addPatientToothEvents(repos: Repos, patientId: string, body: unknown) {
  const parsed = parseAddToothEventsBatch(body);
  if (!parsed.ok) return parsed;
  const { ids } = await repos.toothEvents.addMany(
    patientId,
    parsed.value.visitId,
    parsed.value.events,
  );
  const chart = await repos.toothEvents.chartForPatient(patientId, {
    highlightVisitId: parsed.value.visitId,
  });
  return { ok: true as const, eventIds: ids, chart };
}

// B10: history of one tooth for the tooth card (doctor only; the repo checks clinical.view first).
export async function getToothHistory(
  repos: Repos,
  patientId: string,
  fdi: string,
  before: string | null,
) {
  const history = await repos.toothHistory.get(patientId, Number(fdi), { before });
  return { ok: true as const, history };
}
