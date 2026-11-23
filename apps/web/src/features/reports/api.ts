import type { DashboardPayload, DashboardRangePreset } from "@clinic/shared";
import { api } from "../../api/client";

export function recomputeStats() {
  return api<{ days: string[] }>("/api/staff/stats/recompute", { method: "POST", body: {} });
}

export type DashboardQuery = {
  range: DashboardRangePreset;
  from?: string;
  to?: string;
  compare?: boolean;
};

export function fetchDashboard(q: DashboardQuery) {
  const params = new URLSearchParams();
  params.set("range", q.range);
  if (q.range === "custom" && q.from && q.to) {
    params.set("from", q.from);
    params.set("to", q.to);
  }
  if (q.compare) params.set("compare", "1");
  return api<DashboardPayload>(`/api/staff/dashboard?${params}`);
}
