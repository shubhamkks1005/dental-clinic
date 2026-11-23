import { z } from "zod";
import { addIstDays, istDate } from "./time";

export const PATIENT_REQUEST_TYPES = ["correct", "copy", "withdraw_consent", "other"] as const;
export const PATIENT_REQUEST_STATUSES = ["open", "done", "rejected"] as const;

export const PATIENT_REQUEST_TYPE_LABEL: Record<(typeof PATIENT_REQUEST_TYPES)[number], string> = {
  correct: "Correct my details",
  copy: "Copy of my information",
  withdraw_consent: "Withdraw consent",
  other: "Other",
};

export const createPatientRequestSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(PATIENT_REQUEST_TYPES),
  body: z
    .string()
    .trim()
    .min(1, "Enter a short note.")
    .max(500, "Keep the note under 500 characters."),
});

export const closePatientRequestSchema = z.object({
  status: z.enum(["done", "rejected"]),
  note: z.string().trim().min(1, "Enter a short closing note.").max(500),
  version: z.number().int().positive(),
});

export function defaultRequestDueOn(now: Date = new Date()): string {
  return addIstDays(istDate(now), 30);
}
