import type { Repos } from "@clinic/db";
import { parseChangeEstimate, parseCreatePlanItem, parseSetPlanDecision } from "@clinic/shared";

export async function listPlanItems(repos: Repos, patientId: string) {
  const items = await repos.planItems.listForPatient(patientId);
  return { ok: true as const, items };
}

export async function createPlanItem(repos: Repos, body: unknown) {
  const parsed = parseCreatePlanItem(body);
  if (!parsed.ok) return parsed;
  const item = await repos.planItems.create(parsed.value);
  return { ok: true as const, item };
}

export async function changePlanEstimate(repos: Repos, id: string, body: unknown) {
  const parsed = parseChangeEstimate(body);
  if (!parsed.ok) return parsed;
  const item = await repos.planItems.changeEstimate(id, parsed.value);
  return { ok: true as const, item };
}

export async function setPlanDecision(repos: Repos, id: string, body: unknown) {
  const parsed = parseSetPlanDecision(body);
  if (!parsed.ok) return parsed;
  const item = await repos.planItems.setDecision(id, parsed.value);
  return { ok: true as const, item };
}
