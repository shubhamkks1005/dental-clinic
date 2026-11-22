import type { Repos } from "@clinic/db";
import { parseSaveMedicalHistory } from "@clinic/shared";

export async function getMedicalHistory(repos: Repos, patientId: string) {
  const history = await repos.medicalHistory.latest(patientId);
  const alerts = await repos.medicalHistory.listAlerts(patientId);
  return { ok: true as const, history, alerts };
}

export async function saveMedicalHistory(repos: Repos, patientId: string, body: unknown) {
  const merged =
    body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), patientId }
      : { patientId, items: [] };
  const parsed = parseSaveMedicalHistory(merged);
  if (!parsed.ok) return parsed;
  const history = await repos.medicalHistory.save(parsed.value);
  const alerts = await repos.medicalHistory.listAlerts(patientId);
  return { ok: true as const, history, alerts };
}

export async function getAlertFlags(repos: Repos, patientId: string) {
  const flags = await repos.medicalHistory.alertFlags(patientId);
  return { ok: true as const, flags };
}
