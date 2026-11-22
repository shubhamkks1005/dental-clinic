import { z } from "zod";
import { APPOINTMENT_PRIORITIES, APPOINTMENT_SOURCES } from "./appointments";

// 2.3.4 book body. Duration comes from the visit type on the server (snapshotted).
// 2.3.5: optional overrideReason bypasses soft rules (past/closed/lunch/ahead) and sets overbook.
export const bookAppointmentSchema = z.object({
  patientId: z.string().trim().min(1, "Choose a patient.").max(40),
  visitTypeId: z.string().trim().min(1, "Choose a visit type.").max(40),
  dateLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Choose a real date."),
  startMin: z
    .number({ error: "Choose a start time." })
    .int("Start time must be whole minutes.")
    .min(0, "Start time is too early.")
    .max(1439, "Start time is too late."),
  source: z.enum(APPOINTMENT_SOURCES),
  priority: z.enum(APPOINTMENT_PRIORITIES).default("normal"),
  complaint: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 letters.")
    .optional()
    .transform((v) => v || null),
  overrideReason: z
    .string()
    .trim()
    .max(200, "Keep the override reason under 200 letters.")
    .optional()
    .transform((v) => v || null),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export function parseBookAppointment(body: unknown) {
  const parsed = bookAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}
