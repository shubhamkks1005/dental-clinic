import { z } from "zod";

export const PLAN_ITEM_STATUSES = [
  "planned",
  "accepted",
  "declined",
  "deferred",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type PlanItemStatus = (typeof PLAN_ITEM_STATUSES)[number];

export const createPlanItemBody = z
  .object({
    patientId: z.string().min(1),
    toothFdi: z.number().int().nullable().optional(),
    procedureLabel: z.string().trim().min(1).max(120),
    listItemId: z.string().min(1).nullable().optional(),
    estimatePaise: z.number().int().min(0).max(50_000_000),
    phase: z.number().int().min(1).max(10).default(1),
    sittings: z.number().int().min(1).max(20).default(1),
  })
  .strict();

export type CreatePlanItemInput = z.infer<typeof createPlanItemBody>;

export const changeEstimateBody = z
  .object({
    estimatePaise: z.number().int().min(0).max(50_000_000),
    reason: z.string().trim().min(1).max(300),
    version: z.number().int().min(1),
  })
  .strict();

export type ChangeEstimateInput = z.infer<typeof changeEstimateBody>;
