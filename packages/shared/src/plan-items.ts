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

/** Default phase labels (3.6.1). Editable later via settings if needed. */
export const DEFAULT_PLAN_PHASE_LABELS: Record<number, string> = {
  1: "Urgent",
  2: "Disease control",
  3: "Repair",
  4: "Esthetic",
};

export function planPhaseLabel(phase: number): string {
  return DEFAULT_PLAN_PHASE_LABELS[phase] ?? `Phase ${phase}`;
}

export const createPlanItemBody = z
  .object({
    patientId: z.string().min(1),
    toothFdi: z.number().int().nullable().optional(),
    procedureLabel: z.string().trim().min(1).max(120),
    listItemId: z.string().min(1).nullable().optional(),
    estimatePaise: z.number().int().min(0).max(50_000_000),
    phase: z.number().int().min(1).max(10).default(1),
    sittings: z.number().int().min(1).max(20).default(1),
    createdVisitId: z.string().min(1).nullable().optional(),
  })
  .strict();

export type CreatePlanItemInput = z.infer<typeof createPlanItemBody>;

export function parseCreatePlanItem(body: unknown) {
  const parsed = createPlanItemBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the plan form.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

export const changeEstimateBody = z
  .object({
    estimatePaise: z.number().int().min(0).max(50_000_000),
    reason: z.string().trim().min(1).max(300),
    version: z.number().int().min(1),
  })
  .strict();

export type ChangeEstimateInput = z.infer<typeof changeEstimateBody>;

export function parseChangeEstimate(body: unknown) {
  const parsed = changeEstimateBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the estimate change.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

/** Patient decision on a plan item (3.6.2). accepted requires toldOn. */
export const setPlanDecisionBody = z
  .object({
    status: z.enum(["planned", "accepted", "declined", "deferred", "cancelled"]),
    toldOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    version: z.number().int().min(1),
  })
  .strict();

export type SetPlanDecisionInput = z.infer<typeof setPlanDecisionBody>;

export function parseSetPlanDecision(body: unknown) {
  const parsed = setPlanDecisionBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the plan decision.",
    };
  }
  return { ok: true as const, value: parsed.data };
}
