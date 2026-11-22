import { z } from "zod";

// 2.3.8: move to a new slot; old row becomes rescheduled and stays for history.
export const rescheduleAppointmentSchema = z.object({
  version: z
    .number({ error: "Reload and try again." })
    .int("Reload and try again.")
    .positive("Reload and try again."),
  dateLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Choose a real date."),
  startMin: z
    .number({ error: "Choose a start time." })
    .int("Start time must be whole minutes.")
    .min(0, "Start time is too early.")
    .max(1439, "Start time is too late."),
  visitTypeId: z.string().trim().min(1).max(40).optional(),
  overrideReason: z
    .string()
    .trim()
    .max(200, "Keep the override reason under 200 letters.")
    .optional()
    .transform((v) => v || null),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export function parseRescheduleAppointment(body: unknown) {
  const parsed = rescheduleAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}
