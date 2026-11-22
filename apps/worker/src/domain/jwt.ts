// Pure JWT checks for RS256 tokens (Google ID tokens now, Cloudflare Access tokens later).
// Key fetching lives in adapters/jwks.ts; nothing here does I/O except Web Crypto.

export type Jwk = JsonWebKey & { kid?: string };
export type JwtPayload = Record<string, unknown>;
export type VerifyResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; reason: "malformed" | "alg" | "unknown_kid" | "signature" };

type Decoded = {
  header: { alg?: unknown; kid?: unknown };
  payload: JwtPayload;
  signingInput: string;
  signature: Uint8Array;
};

export function base64UrlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

export function decodeJwt(token: string): Decoded | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts as [string, string, string];
  try {
    const text = (part: string) => new TextDecoder().decode(base64UrlDecode(part));
    const header = JSON.parse(text(h)) as Decoded["header"];
    const payload = JSON.parse(text(p)) as JwtPayload;
    if (typeof payload !== "object" || payload === null) return null;
    return { header, payload, signingInput: `${h}.${p}`, signature: base64UrlDecode(s) };
  } catch {
    return null;
  }
}

// Only RS256, and the token must name its key (kid): both Google and Access do.
export async function verifyRs256(token: string, keys: readonly Jwk[]): Promise<VerifyResult> {
  const decoded = decodeJwt(token);
  if (!decoded) return { ok: false, reason: "malformed" };
  if (decoded.header.alg !== "RS256") return { ok: false, reason: "alg" };
  const jwk = keys.find((k) => k.kid !== undefined && k.kid === decoded.header.kid);
  if (!jwk) return { ok: false, reason: "unknown_kid" };
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decoded.signature,
    new TextEncoder().encode(decoded.signingInput),
  );
  return valid ? { ok: true, payload: decoded.payload } : { ok: false, reason: "signature" };
}

export type ClaimRules = {
  issuers: readonly string[];
  audience: string;
  nowSec: number;
  skewSec?: number;
};

// Returns the first problem, or null when the standard claims are acceptable.
export function checkStandardClaims(payload: JwtPayload, rules: ClaimRules): string | null {
  const skew = rules.skewSec ?? 60;
  const { iss, aud, exp, iat, nbf } = payload;
  if (typeof iss !== "string" || !rules.issuers.includes(iss)) return "iss";
  const audiences = Array.isArray(aud) ? aud : [aud];
  if (!audiences.includes(rules.audience)) return "aud";
  if (typeof exp !== "number" || exp <= rules.nowSec - skew) return "exp";
  if (typeof iat === "number" && iat > rules.nowSec + skew) return "iat";
  if (typeof nbf === "number" && nbf > rules.nowSec + skew) return "nbf";
  return null;
}
