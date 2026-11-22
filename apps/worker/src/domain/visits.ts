import type { Repos } from "@clinic/db";
import { parseAddVisitAddendum, parseFinaliseVisit, parseOpenVisit } from "@clinic/shared";

export async function openVisit(repos: Repos, body: unknown) {
  const parsed = parseOpenVisit(body);
  if (!parsed.ok) return parsed;
  const visit = await repos.visits.open(parsed.value);
  return { ok: true as const, visit };
}

export async function getVisit(repos: Repos, id: string) {
  const visit = await repos.visits.getById(id);
  return { ok: true as const, visit };
}

export async function listRecentVisits(repos: Repos, patientId: string, limit: number | undefined) {
  const visits = await repos.visits.listRecentByPatient(patientId, { limit });
  return { ok: true as const, visits };
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
