import { z } from "zod";

// 3.2.4 medical history answers: yes / no / unknown (+ optional note).
export const MEDICAL_ANSWERS = ["yes", "no", "unknown"] as const;
export type MedicalAnswer = (typeof MEDICAL_ANSWERS)[number];

export const medicalHistoryItemSchema = z
  .object({
    code: z.string().trim().min(1).max(40),
    label: z.string().trim().min(1).max(120),
    answer: z.enum(MEDICAL_ANSWERS),
    note: z.string().trim().max(500).nullable().optional(),
    restricted: z.boolean().optional(),
    alertLabel: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

export type MedicalHistoryItem = z.infer<typeof medicalHistoryItemSchema>;

export const saveMedicalHistoryBody = z
  .object({
    patientId: z.string().min(1),
    items: z.array(medicalHistoryItemSchema).min(1).max(80),
  })
  .strict();

export type SaveMedicalHistoryInput = z.infer<typeof saveMedicalHistoryBody>;
