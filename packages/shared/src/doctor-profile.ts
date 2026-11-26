import { z } from "zod";

// Each doctor's own prescription letterhead lines (owner 2026-11-26, Q1). Same limits as the old
// single-doctor settings doctor.* (settings.ts), which stay only as the fallback for a doctor
// who has not saved a profile yet.
export const doctorProfileSchema = z.object({
  nameOnRx: z
    .string({ error: "Enter the name for prescriptions." })
    .trim()
    .min(1, "Enter the name for prescriptions.")
    .max(80, "Keep the name under 80 letters."),
  qualifications: z.string().trim().max(120, "Keep it under 120 letters.").default(""),
  speciality: z.string().trim().max(80, "Keep it under 80 letters.").default(""),
  registrationNo: z.string().trim().max(40, "Keep it under 40 letters.").default(""),
  extraLine: z.string().trim().max(120, "Keep it under 120 letters.").default(""),
});

export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;

export type DoctorProfile = DoctorProfileInput & { id: string; userId: string; version: number };

/** PUT body: the fields plus the version the doctor started from (0 = first save). */
export const saveDoctorProfileSchema = doctorProfileSchema.extend({
  version: z.number({ error: "Reload and try again." }).int().min(0),
});
