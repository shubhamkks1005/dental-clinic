import type { ChartCell, ChartView } from "@clinic/shared";
import { api } from "../../api/client";

export type ChartHistoryVisit = {
  id: string;
  visitDateLocal: string;
  finalisedAt: string;
};

export type PatientChart = {
  cells: ChartCell[];
  rowsRead: number;
  asOfVisitId: string | null;
  history: ChartHistoryVisit[];
};

type ChartReply = { chart: PatientChart };

export function getPatientChart(
  patientId: string,
  opts: { asOfVisitId?: string; highlightVisitId?: string } = {},
) {
  const q = new URLSearchParams();
  if (opts.asOfVisitId) q.set("asOfVisitId", opts.asOfVisitId);
  if (opts.highlightVisitId) q.set("highlightVisitId", opts.highlightVisitId);
  const qs = q.toString();
  return api<ChartReply>(`/api/staff/patients/${patientId}/chart${qs ? `?${qs}` : ""}`).then(
    (r) => r.chart,
  );
}

export function addChartEvent(
  patientId: string,
  body: { visitId: string; toothFdi: number; surface: string; conditionCode: string },
) {
  return api<{ eventId: string; chart: PatientChart }>(
    `/api/staff/patients/${patientId}/chart/events`,
    { method: "POST", body: body },
  );
}

export function openDraftVisit(patientId: string, visitDateLocal: string) {
  return api<{ visit: { id: string; status: string } }>("/api/staff/visits", {
    method: "POST",
    body: { patientId, visitDateLocal },
  }).then((r) => r.visit);
}

export async function loadChartView(): Promise<ChartView | null> {
  const { settings } = await api<{ settings: { key: string; value: unknown }[] }>(
    "/api/staff/settings",
  );
  const row = settings.find((s) => s.key === "chart.view");
  return row?.value && typeof row.value === "object" ? (row.value as ChartView) : null;
}
