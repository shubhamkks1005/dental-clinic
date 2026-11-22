/** Pure size helpers for browser image prep (3.7.3). */

export const THUMB_MAX_EDGE = 300;
export const PHOTO_MAX_EDGE = 2000;
export const PHOTO_JPEG_QUALITY = 0.85;

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height };
  const scale = maxEdge / edge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** X-ray kinds keep original bytes; phone photos are recompressed. */
export function shouldRecompressOriginal(kind: string): boolean {
  return kind === "photo";
}

export function canMakeImageThumb(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}
