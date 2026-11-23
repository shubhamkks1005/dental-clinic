import { z } from "zod";
import { tunableDefault } from "./tunables";

export const CALL_LIST_KINDS = ["incomplete", "recall"] as const;
export type CallListKind = (typeof CALL_LIST_KINDS)[number];

/** 6.5.3: aliases of TUNABLES defaults (settings override at runtime). */
export const INCOMPLETE_DAYS_DEFAULT = tunableDefault("outreach.incomplete_days");
export const RECALL_MIN_MONTHS_DEFAULT = tunableDefault("outreach.recall_min_months");
export const RECALL_MAX_MONTHS_DEFAULT = tunableDefault("outreach.recall_max_months");

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
