import { api } from "../../api/client";

export type VisitSummary = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  visitDateLocal: string;
  status: "draft" | "final" | "void";
  version: number;
};

export function openVisit(body: {
  patientId: string;
  appointmentId?: string | null;
  visitDateLocal: string;
}) {
  return api<{ visit: VisitSummary }>("/api/staff/visits", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.visit);
}

export function getVisit(id: string) {
  return api<{ visit: VisitSummary }>(`/api/staff/visits/${encodeURIComponent(id)}`).then(
    (r) => r.visit,
  );
}
