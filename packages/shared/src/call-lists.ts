import { z } from "zod";

export const CALL_LIST_KINDS = ["incomplete", "recall"] as const;
export type CallListKind = (typeof CALL_LIST_KINDS)[number];

/** Defaults until 6.5.3 moves them to settings. */
export const INCOMPLETE_DAYS_DEFAULT = 30;
export const RECALL_MIN_MONTHS_DEFAULT = 6;
export const RECALL_MAX_MONTHS_DEFAULT = 9;

export const parseCallListKind = z.enum(CALL_LIST_KINDS);

export const parseOutreachContact = z.object({
  note: z.string().trim().min(1).max(500),
});

export type CallListRow = {
  patientId: string;
  patientCode: string;
  patientName: string;
  detail: string;
  amountPaise: number | null;
  /** Phase 7 reminder hook placeholder. */
  reminderHook: { kind: CallListKind; patientId: string };
};
