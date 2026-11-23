import { api } from "../../api/client";

export function recomputeStats() {
  return api<{ days: string[] }>("/api/staff/stats/recompute", { method: "POST", body: {} });
}
