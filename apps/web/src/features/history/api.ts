import { api } from "../../api/client";

export type HistorySummary = {
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  alertLabels: string[];
  hasAlert: boolean;
  hasRestricted: boolean;
  outstandingDuePaise: number;
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
};

export function getHistorySummary(patientId: string) {
  return api<{ summary: HistorySummary }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/history/summary`,
  ).then((r) => r.summary);
}
