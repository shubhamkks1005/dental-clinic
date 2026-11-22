import type { Repos } from "@clinic/db";
import {
  parseCreatePrescription,
  parseIssuePrescription,
  parsePatchPrescription,
  parseReplacePrescriptionItems,
} from "@clinic/shared";

export async function createPrescription(repos: Repos, body: unknown) {
  const parsed = parseCreatePrescription(body);
  if (!parsed.ok) return parsed;
  const prescription = await repos.prescriptions.create(parsed.value);
  return { ok: true as const, prescription };
}

export async function getPrescription(repos: Repos, id: string) {
  const prescription = await repos.prescriptions.get(id);
  return { ok: true as const, prescription };
}

export async function listVisitPrescriptions(repos: Repos, visitId: string) {
  const prescriptions = await repos.prescriptions.listForVisit(visitId);
  return { ok: true as const, prescriptions };
}

export async function replacePrescriptionItems(repos: Repos, id: string, body: unknown) {
  const parsed = parseReplacePrescriptionItems(body);
  if (!parsed.ok) return parsed;
  const prescription = await repos.prescriptions.replaceItems(
    id,
    parsed.value.version,
    parsed.value.items,
  );
  return { ok: true as const, prescription };
}

export async function patchPrescription(repos: Repos, id: string, body: unknown) {
  const parsed = parsePatchPrescription(body);
  if (!parsed.ok) return parsed;
  const prescription = await repos.prescriptions.patchMeta(id, parsed.value);
  return { ok: true as const, prescription };
}

export async function issuePrescription(repos: Repos, id: string, body: unknown) {
  const parsed = parseIssuePrescription(body);
  if (!parsed.ok) return parsed;
  const prescription = await repos.prescriptions.issue(id, parsed.value.version);
  return { ok: true as const, prescription };
}

export async function revisePrescription(repos: Repos, id: string) {
  const prescription = await repos.prescriptions.revise(id);
  return { ok: true as const, prescription };
}

export async function copyPreviousPrescription(
  repos: Repos,
  body: unknown,
): Promise<
  | { ok: true; prescription: Awaited<ReturnType<Repos["prescriptions"]["copyPrevious"]>> }
  | { ok: false; message: string }
> {
  const patientId =
    body && typeof body === "object" && "patientId" in body
      ? String((body as { patientId: unknown }).patientId ?? "")
      : "";
  if (!patientId) return { ok: false, message: "Choose a patient." };
  const visitId =
    body && typeof body === "object" && "visitId" in body
      ? ((body as { visitId?: string | null }).visitId ?? null)
      : null;
  const prescription = await repos.prescriptions.copyPrevious(patientId, visitId);
  return { ok: true as const, prescription };
}
