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
};

export type VisitRecent = {
  id: string;
  visitDateLocal: string;
  status: "draft" | "final";
  chiefComplaint: string | null;
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

export function listRecentVisits(patientId: string, limit = 3) {
  const q = new URLSearchParams({ limit: String(limit) });
  return api<{ visits: VisitRecent[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/visits?${q}`,
  ).then((r) => r.visits);
}
