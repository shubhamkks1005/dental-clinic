import { z } from "zod";

// 3.2.1 visit statuses. Finalised rows are locked; corrections are addenda (3.2.6 / 3.5.7).
export const VISIT_STATUSES = ["draft", "final", "void"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  draft: "Draft",
  final: "Finalised",
  void: "Void",
};

// Optional vitals on the visit (integers; BP as systolic/diastolic mmHg).
export const visitVitalsSchema = z
  .object({
    bpSystolic: z.number().int().min(50).max(300).nullable().optional(),
    bpDiastolic: z.number().int().min(20).max(200).nullable().optional(),
    pulse: z.number().int().min(20).max(250).nullable().optional(),
  })
  .strict();

export type VisitVitals = z.infer<typeof visitVitalsSchema>;

// Open or create a draft visit (3.5.1 will call this from Today / profile).
export const openVisitBody = z
  .object({
    patientId: z.string().min(1),
    appointmentId: z.string().min(1).nullable().optional(),
    visitDateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-22."),
  })
  .strict();

export type OpenVisitInput = z.infer<typeof openVisitBody>;
