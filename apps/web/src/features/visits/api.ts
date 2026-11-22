import { api } from "../../api/client";

/** Row returned when opening a draft (may omit clinical note fields). */
export type VisitOpened = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  visitDateLocal: string;
  status: "draft" | "final" | "void";
  version: number;
};

export type VisitDiagnosis = {
  id: string;
  visitId: string;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  sortOrder: number;
};

export type VisitProcedure = {
  id: string;
  visitId: string;
  listItemId: string | null;
  label: string;
  toothFdi: number | null;
  surfaces: Array<"m" | "d" | "o" | "b" | "l" | "whole">;
  note: string | null;
  defaultPaise: number | null;
  sortOrder: number;
};

export type VisitSummary = VisitOpened & {
  chiefComplaint: string | null;
  historyNote: string | null;
  examNote: string | null;
  gumCondition: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  advice: string | null;
  nextVisitNote: string | null;
  finalisedAt: string | null;
  finalisedBy: string | null;
  snapshotHash: string | null;
  diagnoses: VisitDiagnosis[];
  procedures: VisitProcedure[];
};

export type VisitRecent = {
  id: string;
  visitDateLocal: string;
  status: "draft" | "final";
  chiefComplaint: string | null;
};

export type VisitPatchBody = {
  version: number;
  chiefComplaint?: string | null;
  historyNote?: string | null;
  examNote?: string | null;
  gumCondition?: string | null;
  advice?: string | null;
  nextVisitNote?: string | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulse?: number | null;
};

export function openVisit(body: {
  patientId: string;
  appointmentId?: string | null;
  visitDateLocal: string;
}) {
  return api<{ visit: VisitOpened }>("/api/staff/visits", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.visit);
}

export function getVisit(id: string) {
  return api<{ visit: VisitSummary }>(`/api/staff/visits/${encodeURIComponent(id)}`).then(
    (r) => r.visit,
  );
}

export function patchVisit(id: string, body: VisitPatchBody) {
  return api<{ visit: VisitSummary }>(`/api/staff/visits/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((r) => r.visit);
}

export function addVisitDiagnosis(
  visitId: string,
  body: { listItemId?: string | null; freeText?: string | null; toothFdi?: number | null },
) {
  return api<{ diagnosis: VisitDiagnosis }>(
    `/api/staff/visits/${encodeURIComponent(visitId)}/diagnoses`,
    { method: "POST", body: JSON.stringify(body) },
  ).then((r) => r.diagnosis);
}

export function addVisitProcedure(
  visitId: string,
  body: {
    listItemId: string;
    toothFdi?: number | null;
    surfaces?: Array<"m" | "d" | "o" | "b" | "l" | "whole">;
    note?: string | null;
  },
) {
  return api<{ procedure: VisitProcedure }>(
    `/api/staff/visits/${encodeURIComponent(visitId)}/procedures`,
    { method: "POST", body: JSON.stringify(body) },
  ).then((r) => r.procedure);
}

export function finaliseVisit(id: string, version: number) {
  return api<{
    visit: { id: string; status: string; snapshotHash: string | null; version: number };
  }>(`/api/staff/visits/${encodeURIComponent(id)}/finalise`, {
    method: "POST",
    body: JSON.stringify({ version }),
  }).then((r) => r.visit);
}

export function listRecentVisits(patientId: string, limit = 3) {
  const q = new URLSearchParams({ limit: String(limit) });
  return api<{ visits: VisitRecent[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/visits?${q}`,
  ).then((r) => r.visits);
}
