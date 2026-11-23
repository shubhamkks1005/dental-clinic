import type { PlanItemStatus } from "@clinic/shared";

export type PlanItemDetail = {
  id: string;
  patientId: string;
  toothFdi: number | null;
  listItemId: string | null;
  procedureLabel: string;
  estimatePaise: number;
  /** 5.3.15: sum of issued bill lines linked via plan_item_id. */
  billedPaise: number;
  /** 5.3.15: allocations on those bills, pro-rated by line share. */
  paidPaise: number;
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
