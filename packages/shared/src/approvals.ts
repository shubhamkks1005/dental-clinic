import { z } from "zod";

/** What the desk may ask the doctor. The answer is only recorded for now (decision 9). */
export const APPROVAL_TYPES = [
  "emergency_insert",
  "refund",
  "overbook",
  "late_today",
  "break_shorten",
  "reschedule_close",
  "order_override",
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_STATUSES = ["open", "approved", "rejected", "dismissed"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_TYPE_LABEL: Record<ApprovalType, string> = {
  emergency_insert: "Emergency insert",
  refund: "Refund",
  overbook: "Overbook",
  late_today: "Late, coming today",
  break_shorten: "Shorten the break",
  reschedule_close: "Reschedule close to the time",
  order_override: "Change the order",
};

const id = z.string().trim().min(1).max(40);

export const createApprovalSchema = z
  .object({
    type: z.enum(APPROVAL_TYPES, { error: "Choose what to ask the doctor." }),
    appointmentId: id.optional(),
    patientId: id.optional(),
    billId: id.optional(),
    /** Several doctors (0066): who answers. Taken from the booking or bill when there is one. */
    doctorId: id.optional(),
    note: z
      .string({ error: "Write a short note for the doctor." })
      .trim()
      .min(1, "Write a short note for the doctor.")
      .max(200, "Keep the note under 200 letters."),
    urgent: z.boolean().default(false),
    detail: z.string().trim().max(60).optional(),
  })
  .refine((v) => Boolean(v.appointmentId || v.patientId || v.billId), {
    message: "Choose a patient, appointment or bill.",
    path: ["appointmentId"],
  });
export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

export const answerApprovalSchema = z.object({
  decision: z.enum(["approve", "reject"], { error: "Choose Yes or No." }),
  note: z.string().trim().max(200, "Keep the note under 200 letters.").optional(),
  version: z.number().int().min(1),
});
export type AnswerApprovalInput = z.infer<typeof answerApprovalSchema>;

/** One request as the Waiting-for-you list and the desk strip show it. */
export type ApprovalItem = {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  appointmentId: string | null;
  patientId: string | null;
  billId: string | null;
  /** The doctor who answers it (0066); null on requests made before several doctors. */
  doctorId: string | null;
  patientName: string | null;
  patientCode: string | null;
  note: string;
  detail: string | null;
  urgent: boolean;
  answerNote: string | null;
  answeredAt: string | null;
  requestedByName: string | null;
  createdAt: string;
  version: number;
};
