import { z } from "zod";

export const CERTIFICATE_STATUSES = ["draft", "finalised", "revised"] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const CERTIFICATE_SIGN_METHODS = ["signature", "thumb"] as const;
export type CertificateSignMethod = (typeof CERTIFICATE_SIGN_METHODS)[number];

/** Shown on every medical certificate until doctor/lawyer confirm wording. */
export const CERTIFICATE_DRAFT_BANNER = "DRAFT - doctor to confirm. DRAFT - lawyer to confirm.";

const dateOn = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date as YYYY-MM-DD.");

export const createCertificateBody = z
  .object({
    patientId: z.string().min(1),
    patientName: z.string().trim().min(1).max(200),
    patientAge: z.string().trim().min(1).max(40),
    patientAddress: z.string().trim().max(500).default(""),
    identificationMark: z.string().trim().min(1).max(200),
    signMethod: z.enum(CERTIFICATE_SIGN_METHODS),
    reason: z.string().trim().min(1).max(1000),
    fromOn: dateOn,
    toOn: dateOn,
    diagnosis: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

export type CreateCertificateInput = z.infer<typeof createCertificateBody>;

export function parseCreateCertificate(body: unknown) {
  const parsed = createCertificateBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the certificate.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

export const patchCertificateBody = z
  .object({
    patientName: z.string().trim().min(1).max(200).optional(),
    patientAge: z.string().trim().min(1).max(40).optional(),
    patientAddress: z.string().trim().max(500).optional(),
    identificationMark: z.string().trim().min(1).max(200).optional(),
    signMethod: z.enum(CERTIFICATE_SIGN_METHODS).optional(),
    reason: z.string().trim().min(1).max(1000).optional(),
    fromOn: dateOn.optional(),
    toOn: dateOn.optional(),
    diagnosis: z.string().trim().max(500).nullable().optional(),
    version: z.number().int().positive(),
  })
  .strict();

export function parsePatchCertificate(body: unknown) {
  const parsed = patchCertificateBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the certificate.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

export const finaliseCertificateBody = z
  .object({
    version: z.number().int().positive(),
  })
  .strict();

export function parseFinaliseCertificate(body: unknown) {
  const parsed = finaliseCertificateBody.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the version.",
    };
  }
  return { ok: true as const, value: parsed.data };
}
