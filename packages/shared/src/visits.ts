import { statusWord } from "./status-words";
import { z } from "zod";

// 3.2.1 visit statuses. Finalised rows are locked; corrections are addenda (3.2.6 / 3.5.7).
export const VISIT_STATUSES = ["draft", "final", "void"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  draft: statusWord("visit", "draft").label,
  final: statusWord("visit", "final").label,
  void: statusWord("visit", "void").label,
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

export function parseOpenVisit(body: unknown) {
  const parsed = openVisitBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

// 3.2.6 / 3.5.6: lock a draft. Version is the one the doctor last saw.
export const finaliseVisitBody = z
  .object({
    version: z.number({ error: "Reload the visit and try again." }).int().positive(),
  })
  .strict();

export type FinaliseVisitInput = z.infer<typeof finaliseVisitBody>;

export function parseFinaliseVisit(body: unknown) {
  const parsed = finaliseVisitBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

export const ADDENDUM_KINDS = ["note", "entered_in_error"] as const;
export type AddendumKind = (typeof ADDENDUM_KINDS)[number];

// 3.2.6 / 3.5.7: correction after finalise. Never edits the locked visit row.
export const addVisitAddendumBody = z
  .object({
    body: z.string().trim().min(1, "Enter the addendum text.").max(4000),
    reason: z.string().trim().min(1, "Enter a reason for the addendum.").max(500),
    kind: z.enum(ADDENDUM_KINDS).optional(),
  })
  .strict();

export type AddVisitAddendumInput = z.infer<typeof addVisitAddendumBody>;

export function parseAddVisitAddendum(body: unknown) {
  const parsed = addVisitAddendumBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

const noteField = z.string().trim().max(4000).nullable().optional();

// 3.5.3 / 3.5.5: patch only changed draft fields. Version is the one the doctor last saw.
export const patchVisitBody = z
  .object({
    version: z.number({ error: "Reload the visit and try again." }).int().positive(),
    chiefComplaint: noteField,
    historyNote: noteField,
    examNote: noteField,
    gumCondition: z.string().trim().max(200).nullable().optional(),
    advice: noteField,
    nextVisitNote: noteField,
    bpSystolic: z.number().int().min(50).max(300).nullable().optional(),
    bpDiastolic: z.number().int().min(20).max(200).nullable().optional(),
    pulse: z.number().int().min(20).max(250).nullable().optional(),
    noDiagnosis: z.boolean().optional(),
    noProcedure: z.boolean().optional(),
  })
  .strict();

export type PatchVisitInput = z.infer<typeof patchVisitBody>;

export function parsePatchVisit(body: unknown) {
  const parsed = patchVisitBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

export const addVisitDiagnosisBody = z
  .object({
    listItemId: z.string().min(1).nullable().optional(),
    freeText: z.string().trim().max(500).nullable().optional(),
    toothFdi: z.number().int().min(11).max(85).nullable().optional(),
  })
  .strict()
  .refine((v) => Boolean(v.listItemId?.trim()) || Boolean(v.freeText?.trim()), {
    message: "Enter a diagnosis or pick one from the list.",
  });

export type AddVisitDiagnosisBody = z.infer<typeof addVisitDiagnosisBody>;

export function parseAddVisitDiagnosis(body: unknown) {
  const parsed = addVisitDiagnosisBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

const surfaceSchema = z.enum(["m", "d", "o", "b", "l", "whole"]);

// 3.5.4: procedure from the procedures list; tooth/surfaces usually from chart selection.
export const addVisitProcedureBody = z
  .object({
    listItemId: z.string().min(1, "Pick a procedure."),
    toothFdi: z.number().int().min(11).max(85).nullable().optional(),
    surfaces: z.array(surfaceSchema).max(6).optional(),
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export type AddVisitProcedureBody = z.infer<typeof addVisitProcedureBody>;

export function parseAddVisitProcedure(body: unknown) {
  const parsed = addVisitProcedureBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

const lineVersion = z.number({ error: "Reload the visit and try again." }).int().positive();

// Remove and Undo (restore) a diagnosis or procedure line: the version the doctor last saw.
export const visitLineVersionBody = z.object({ version: lineVersion }).strict();

export function parseVisitLineVersion(body: unknown) {
  const parsed = visitLineVersionBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

export const updateVisitDiagnosisBody = z
  .object({
    version: lineVersion,
    toothFdi: z.number().int().min(11).max(85).nullable(),
  })
  .strict();

export function parseUpdateVisitDiagnosis(body: unknown) {
  const parsed = updateVisitDiagnosisBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}

export const updateVisitProcedureBody = z
  .object({
    version: lineVersion,
    toothFdi: z.number().int().min(11).max(85).nullable().optional(),
    surfaces: z.array(surfaceSchema).max(6).optional(),
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export function parseUpdateVisitProcedure(body: unknown) {
  const parsed = updateVisitProcedureBody.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { ok: true as const, value: parsed.data };
}
