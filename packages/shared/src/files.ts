import { z } from "zod";
import { FILE_KINDS, FILE_MIME_TYPES, type FileKind, type FileMimeType } from "./enums";

/** Patient-upload kinds (not clinic logo/signature). */
export const PATIENT_FILE_KINDS = [
  "iopa",
  "opg",
  "photo",
  "scan",
  "consent",
  "other",
] as const satisfies readonly FileKind[];
export type PatientFileKind = (typeof PATIENT_FILE_KINDS)[number];

/** X-ray / clinical photo kinds — files.clinical only. */
export const CLINICAL_FILE_KINDS = ["iopa", "opg", "photo"] as const satisfies readonly FileKind[];

/** Scan + consent — files.documents (receptionist allowed). */
export const DOCUMENT_FILE_KINDS = ["scan", "consent"] as const satisfies readonly FileKind[];

export const FILE_MAX_BYTES = 15 * 1024 * 1024;

export type FileRow = {
  id: string;
  patientId: string | null;
  kind: FileKind;
  mime: FileMimeType;
  bytes: number;
  sha256: string;
  originalFilename: string;
  caption: string | null;
  toothFdi: number | null;
  takenOn: string | null;
  hasThumb: boolean;
  createdAt: string;
  createdBy: string;
};

export function actionForFileKind(kind: FileKind): "files.clinical" | "files.documents" | null {
  if ((DOCUMENT_FILE_KINDS as readonly string[]).includes(kind)) return "files.documents";
  // iopa/opg/photo/other — doctor only (receptionist: scan + consent only).
  if ((CLINICAL_FILE_KINDS as readonly string[]).includes(kind) || kind === "other") {
    return "files.clinical";
  }
  return null;
}

const toothFdi = z
  .number()
  .int()
  .refine(
    (n) => (n >= 11 && n <= 48) || (n >= 51 && n <= 85),
    "Tooth number must be a valid FDI code.",
  );

export const fileUploadMetaSchema = z
  .object({
    kind: z.enum(PATIENT_FILE_KINDS),
    caption: z.string().trim().max(200).optional(),
    toothFdi: toothFdi.optional(),
    takenOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-23.")
      .optional(),
  })
  .strict();

export type FileUploadMeta = z.infer<typeof fileUploadMetaSchema>;

export function parseFileUploadMeta(input: unknown) {
  const parsed = fileUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the file details.",
    };
  }
  return { ok: true as const, value: parsed.data };
}

export function isAllowedFileMime(mime: string): mime is FileMimeType {
  return (FILE_MIME_TYPES as readonly string[]).includes(mime);
}

export { FILE_KINDS, FILE_MIME_TYPES };
