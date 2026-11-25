// Rules for the QR picture the doctor uploads (the setting accepts PNG or JPEG data URLs of 40 KB).
export const QR_MAX_FILE_BYTES = 40_000;

/** A sentence when the chosen file cannot be the QR picture, else null. */
export function qrFileProblem(file: { type: string; size: number }): string | null {
  if (file.type !== "image/png" && file.type !== "image/jpeg") return "Use a PNG or JPEG picture.";
  if (file.size > QR_MAX_FILE_BYTES) return "The picture is too big. Use one under 40 KB.";
  return null;
}
