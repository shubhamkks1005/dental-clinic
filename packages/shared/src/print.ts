import { z } from "zod";

export const PRINT_DOCUMENT_KINDS = [
  "prescription",
  "estimate",
  "consent",
  "certificate",
  "blank_form",
  "day_list",
  "bill",
  "receipt",
] as const;
export type PrintDocumentKind = (typeof PRINT_DOCUMENT_KINDS)[number];

export const recordPrintBody = z
  .object({
    documentKind: z.enum(PRINT_DOCUMENT_KINDS),
    documentId: z.string().min(1),
    documentVersion: z.number().int().positive().nullable().optional(),
    copies: z.number().int().min(1).max(50).optional().default(1),
  })
  .strict();

export function parseRecordPrint(body: unknown) {
  const parsed = recordPrintBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the print request.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

/** 4.3.2: block certificate/Rx letterhead finalise when registration is empty. */
export function registrationMissing(registrationNo: string | null | undefined): boolean {
  return !registrationNo?.trim();
}
