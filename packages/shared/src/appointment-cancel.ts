import { z } from "zod";

export const CANCEL_REASONS = [
  "patient_request",
  "doctor_unavailable",
  "emergency",
  "other",
] as const;
export type CancelReasonCode = (typeof CANCEL_REASONS)[number];

export const CANCEL_REASON_LABEL: Record<CancelReasonCode, string> = {
  patient_request: "Patient asked to cancel",
  doctor_unavailable: "Doctor not available",
  emergency: "Emergency",
  other: "Other",
};

export const cancelAppointmentSchema = z
  .object({
    version: z
      .number({ error: "Reload and try again." })
      .int("Reload and try again.")
      .positive("Reload and try again."),
    reason: z.enum(CANCEL_REASONS),
    detail: z
      .string()
      .trim()
      .max(200, "Keep the note under 200 letters.")
      .optional()
      .transform((v) => v || null),
    // Stored on the audit row until domain events exist (2.5.1 → Phase 7 SMS).
    notifyPatient: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.reason === "other" && !v.detail) {
      ctx.addIssue({
        code: "custom",
        path: ["detail"],
        message: "Add a short note for Other.",
      });
    }
  });

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export function parseCancelAppointment(body: unknown) {
  const parsed = cancelAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

export function formatCancelReason(reason: CancelReasonCode, detail: string | null): string {
  const label = CANCEL_REASON_LABEL[reason];
  return detail ? `${label}: ${detail}` : label;
}
