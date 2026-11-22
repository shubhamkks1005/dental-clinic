import { z } from "zod";

/** 4.2.1 prescription lifecycle. Issued/revised rows are locked; corrections = new version. */
export const PRESCRIPTION_STATUSES = ["draft", "issued", "revised"] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  revised: "Revised",
};

export const MEDICINE_FORMS = ["Tab", "Cap", "Syp", "Gel", "Mouthwash", "Drops", "Other"] as const;
export type MedicineForm = (typeof MEDICINE_FORMS)[number];

export const MEDICINE_TIMINGS = ["before_food", "after_food", "bedtime", "anytime"] as const;
export type MedicineTiming = (typeof MEDICINE_TIMINGS)[number];

export const MEDICINE_TIMING_LABEL: Record<MedicineTiming, string> = {
  before_food: "Before food",
  after_food: "After food",
  bedtime: "At bedtime",
  anytime: "Anytime",
};

const dateOn = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-23.")
  .nullable()
  .optional();

export const prescriptionItemInput = z
  .object({
    medicineId: z.string().min(1).nullable().optional(),
    genericName: z.string().trim().min(1).max(80),
    brand: z.string().trim().max(80).optional().default(""),
    form: z.string().trim().min(1).max(20),
    strength: z.string().trim().max(40).optional().default(""),
    dose: z.string().trim().min(1).max(40),
    frequency: z.string().trim().min(1).max(20),
    days: z.string().trim().min(1).max(40),
    timing: z.string().trim().min(1).max(20),
    instruction: z.string().trim().max(200).optional().default(""),
    tags: z.string().trim().max(120).optional().default(""),
  })
  .strict();

export type PrescriptionItemInput = z.infer<typeof prescriptionItemInput>;

export const createPrescriptionBody = z
  .object({
    patientId: z.string().min(1),
    visitId: z.string().min(1).nullable().optional(),
    weightKg: z.number().int().min(1).max(300).nullable().optional(),
    advice: z.string().trim().max(2000).optional().default(""),
    followUpOn: dateOn,
    dentistDispensed: z.boolean().optional().default(false),
    dentistDispensedNote: z.string().trim().max(500).optional().default(""),
    items: z.array(prescriptionItemInput).max(30).optional().default([]),
  })
  .strict();

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionBody>;

export function parseCreatePrescription(body: unknown) {
  const parsed = createPrescriptionBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

/**
 * 4.2.3: rough pill count from dose × frequency pattern × days.
 * Frequency like 1-0-1 means 2 doses/day; BD/TDS/SOS/HS are fixed. Not clinical advice.
 */
export function estimateTabletCount(dose: string, frequency: string, days: string): number | null {
  const dayN = Number.parseInt(days, 10);
  if (!Number.isFinite(dayN) || dayN <= 0) return null;
  const doseN = Number.parseFloat(dose);
  const unitsPerDose = Number.isFinite(doseN) && doseN > 0 ? doseN : 1;
  const freq = frequency.trim().toUpperCase();
  let perDay: number | null = null;
  if (/^\d-\d-\d$/.test(frequency.trim())) {
    perDay = frequency
      .trim()
      .split("-")
      .reduce((sum, part) => sum + (Number.parseInt(part, 10) || 0), 0);
  } else if (freq === "BD") perDay = 2;
  else if (freq === "TDS") perDay = 3;
  else if (freq === "HS" || freq === "OD" || freq === "1-0-0") perDay = 1;
  else if (freq === "SOS") perDay = 1;
  if (perDay === null || perDay <= 0) return null;
  return Math.round(unitsPerDose * perDay * dayN);
}
