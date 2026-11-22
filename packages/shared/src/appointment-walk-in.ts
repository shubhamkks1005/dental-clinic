import { z } from "zod";
import { APPOINTMENT_PRIORITIES } from "./appointments";

// 2.3.7 walk-in / emergency body. Server picks "now" slot; emergency may overbook.
export const walkInAppointmentSchema = z.object({
  patientId: z.string().trim().min(1, "Choose a patient.").max(40),
  visitTypeId: z.string().trim().min(1, "Choose a visit type.").max(40),
  priority: z.enum(APPOINTMENT_PRIORITIES).default("normal"),
  complaint: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 letters.")
    .optional()
    .transform((v) => v || null),
});

export type WalkInAppointmentInput = z.infer<typeof walkInAppointmentSchema>;

export function parseWalkInAppointment(body: unknown) {
  const parsed = walkInAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}
