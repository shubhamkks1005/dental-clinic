import type { PlanItemStatus } from "@clinic/shared";

export type PlanItemDetail = {
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
