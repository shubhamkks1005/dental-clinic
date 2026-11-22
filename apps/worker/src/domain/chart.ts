import type { Repos } from "@clinic/db";
import { parseAddToothEvent } from "@clinic/shared";

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
