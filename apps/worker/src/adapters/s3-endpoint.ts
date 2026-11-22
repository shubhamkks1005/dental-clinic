/**
 * Normalise an S3/B2 endpoint for `fetch` / `URL`.
 * Accepts host-only or full URL; always returns https with no trailing slash.
 */
export function normaliseS3Endpoint(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}
