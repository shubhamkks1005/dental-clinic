import { z } from "zod";
import type { AppointmentStatus } from "./appointments";

// Calendar search (owner 2026-11-26, Q7): "when is Mrs Verma coming?" Coming bookings only,
// for the doctors chosen in the calendar filter (a doctor always gets only their own).
export const APPOINTMENT_SEARCH_MAX_ROWS = 30;
export const APPOINTMENT_SEARCH_MAX_PATIENTS = 20;
export const APPOINTMENT_SEARCH_MAX_DOCTORS = 90;

export const appointmentSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Type at least 2 letters.")
    .max(60, "Keep the search under 60 letters."),
  doctors: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 40),
    )
    .refine((ids) => ids.length <= APPOINTMENT_SEARCH_MAX_DOCTORS, "Too many doctors chosen."),
});

export type AppointmentSearchHit = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  dateLocal: string;
  startMin: number;
  doctorId: string | null;
  doctorName: string | null;
  visitTypeLabel: string;
  status: AppointmentStatus;
};
