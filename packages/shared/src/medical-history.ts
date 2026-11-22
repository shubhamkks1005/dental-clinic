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

export function parseSaveMedicalHistory(body: unknown) {
  const parsed = saveMedicalHistoryBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

/** Checklist form sections (3.3.1). Values stored on list item data.section. */
export const MEDICAL_HISTORY_SECTIONS = [
  "conditions",
  "allergies",
  "medicines",
  "pregnancy",
  "habits",
] as const;
export type MedicalHistorySection = (typeof MEDICAL_HISTORY_SECTIONS)[number];

export const MEDICAL_HISTORY_SECTION_LABEL: Record<MedicalHistorySection, string> = {
  conditions: "Medical conditions",
  allergies: "Allergies",
  medicines: "Medicines",
  pregnancy: "Pregnancy / breastfeeding",
  habits: "Habits",
};

export const MEDICAL_ANSWER_LABEL: Record<MedicalAnswer, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Not sure",
};

/** True when recordedAt is older than staleMonths (calendar months). Null history is stale. */
export function isMedicalHistoryStale(
  recordedAt: string | null | undefined,
  staleMonths: number,
  now: Date = new Date(),
): boolean {
  if (!recordedAt) return true;
  const recorded = new Date(recordedAt);
  if (Number.isNaN(recorded.getTime())) return true;
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - staleMonths);
  return recorded.getTime() < cutoff.getTime();
}
