import type { Repos } from "@clinic/db";
import {
  PATIENT_REQUEST_STATUSES,
  closePatientRequestSchema,
  createPatientRequestSchema,
  istDate,
} from "@clinic/shared";

// 8.2.11: staff side of patient requests. Wording and legal deadlines are DRAFT (docs/DECISIONS.md).
type StatusFilter = (typeof PATIENT_REQUEST_STATUSES)[number] | "all";

function parseStatus(raw: string | undefined): StatusFilter {
  if (raw === "all") return "all";
  return PATIENT_REQUEST_STATUSES.find((s) => s === raw) ?? "open";
}

export async function listPatientRequests(
  repos: Repos,
  statusRaw: string | undefined,
  now: Date = new Date(),
) {
  const today = istDate(now);
  const rows = await repos.patientRequests.list(parseStatus(statusRaw));
  return rows.map((r) => ({ ...r, overdue: r.status === "open" && r.dueOn < today }));
}

export function getPatientRequest(repos: Repos, id: string) {
  return repos.patientRequests.get(id);
}

export async function createPatientRequest(repos: Repos, body: unknown) {
  const parsed = createPatientRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const created = await repos.patientRequests.create(parsed.data);
  return { ok: true as const, ...created };
}

export async function closePatientRequest(repos: Repos, id: string, body: unknown) {
  const parsed = closePatientRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const closed = await repos.patientRequests.close(id, parsed.data);
  return { ok: true as const, ...closed };
}
