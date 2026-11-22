import { verifyRs256, type Jwk, type VerifyResult } from "../domain/jwt";

// Signing keys per JWKS URL, kept in isolate memory. The Cache API is not used: it does
// nothing on workers.dev. An unknown kid (key rotation) may force a refetch once per 5 minutes.
type Entry = { keys: Jwk[]; expiresAt: number; fetchedAt: number };

const cache = new Map<string, Entry>();
const REFETCH_GAP_MS = 5 * 60 * 1000;
const DEFAULT_MAX_AGE_S = 3600;
const LONGEST_MAX_AGE_S = 24 * 3600;

function maxAgeSeconds(cacheControl: string | null): number {
  const match = /max-age=(\d+)/.exec(cacheControl ?? "");
  const seconds = match ? Number(match[1]) : DEFAULT_MAX_AGE_S;
  return Math.min(seconds, LONGEST_MAX_AGE_S);
}

async function fetchKeys(url: string, now: number): Promise<Entry> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`JWKS fetch failed with HTTP ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const entry = {
    keys: body.keys ?? [],
    fetchedAt: now,
    expiresAt: now + maxAgeSeconds(response.headers.get("cache-control")) * 1000,
  };
  cache.set(url, entry);
  return entry;
}

export async function getJwks(url: string, forceRefresh = false, now = Date.now()): Promise<Jwk[]> {
  const cached = cache.get(url);
  if (cached && now < cached.expiresAt && !forceRefresh) return cached.keys;
  if (cached && forceRefresh && now - cached.fetchedAt < REFETCH_GAP_MS) return cached.keys;
  return (await fetchKeys(url, now)).keys;
}

export async function verifyWithJwks(token: string, url: string): Promise<VerifyResult> {
  const first = await verifyRs256(token, await getJwks(url));
  if (first.ok || first.reason !== "unknown_kid") return first;
  return verifyRs256(token, await getJwks(url, true));
}

export function clearJwksCache(): void {
  cache.clear();
}
