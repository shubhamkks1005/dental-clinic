import type { PlanItemStatus } from "@clinic/shared";
import { api } from "../../api/client";

export type PlanItem = {
  id: string;
  patientId: string;
  toothFdi: number | null;
  listItemId: string | null;
  procedureLabel: string;
  estimatePaise: number;
  phase: number;
  status: PlanItemStatus;
  sittings: number;
  toldOn: string | null;
  createdVisitId: string | null;
  completedVisitId: string | null;
  version: number;
  createdAt: string;
};

export type PlanItemRow = {
  id: string;
  patientId: string;
  procedureLabel: string;
  estimatePaise: number;
  status: PlanItemStatus;
  version: number;
};

export function listPlanItems(patientId: string) {
  return api<{ items: PlanItem[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/plan-items`,
  ).then((r) => r.items);
}

export function createPlanItem(body: {
  patientId: string;
  toothFdi?: number | null;
  procedureLabel: string;
  listItemId?: string | null;
  estimatePaise: number;
  phase: number;
  sittings: number;
  createdVisitId?: string | null;
}) {
  return api<{ item: PlanItemRow }>("/api/staff/plan-items", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.item);
}

export function changePlanEstimate(
  id: string,
  body: { estimatePaise: number; reason: string; version: number },
) {
  return api<{ item: PlanItemRow }>(`/api/staff/plan-items/${encodeURIComponent(id)}/estimate`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((r) => r.item);
}

export function setPlanDecision(
  id: string,
  body: {
    status: "planned" | "accepted" | "declined" | "deferred" | "cancelled";
    toldOn?: string | null;
    version: number;
  },
) {
  return api<{ item: PlanItemRow }>(`/api/staff/plan-items/${encodeURIComponent(id)}/decision`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((r) => r.item);
}
