import { z } from "zod";
import { APPOINTMENT_PRIORITIES, APPOINTMENT_SOURCES } from "./appointments";

// 2.3.4 book body. The visit type gives the default length; durationMin overrides it
// (owner 2026-11-26: any length, 5-240 min in 5-min steps). Each booking names its doctor.
// 2.3.5: optional overrideReason bypasses soft rules (past/closed/lunch/ahead) and sets overbook.
/** Any length the desk types (HTML: min 5, max 240, step 5). */
export const durationMinSchema = z
  .number({ error: "Type the length in minutes." })
  .int("Use whole minutes.")
  .min(5, "At least 5 minutes.")
  .max(240, "At most 240 minutes.")
  .multipleOf(5, "Use steps of 5 minutes.");

export const doctorIdSchema = z
  .string({ error: "Choose a doctor." })
  .trim()
  .min(1, "Choose a doctor.")
  .max(40);

export const bookAppointmentSchema = z.object({
  patientId: z.string().trim().min(1, "Choose a patient.").max(40),
  visitTypeId: z.string().trim().min(1, "Choose a visit type.").max(40),
  doctorId: doctorIdSchema,
  durationMin: durationMinSchema.optional(),
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
