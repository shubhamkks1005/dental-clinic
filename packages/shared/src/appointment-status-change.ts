import { z } from "zod";
import { APPOINTMENT_STATUSES } from "./appointments";

export const changeAppointmentStatusSchema = z
  .object({
    status: z.enum(APPOINTMENT_STATUSES),
    version: z
      .number({ error: "Reload and try again." })
      .int("Reload and try again.")
      .positive("Reload and try again."),
    cancelReason: z
      .string()
      .trim()
      .max(200, "Keep the cancel reason under 200 letters.")
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (v.status === "no_show" && !v.cancelReason) {
      ctx.addIssue({ code: "custom", path: ["cancelReason"], message: "Say why they missed it." });
    }
  });

export type ChangeAppointmentStatusInput = z.infer<typeof changeAppointmentStatusSchema>;

export function parseChangeAppointmentStatus(body: unknown) {
  const parsed = changeAppointmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}
