import type { Repos } from "@clinic/db";
import { opsStatusHookBodySchema, type OpsStatusHookBody } from "@clinic/shared";
import { safeEqual, sha256 } from "./auth-crypto";

/** HMAC-SHA256 hex of the raw body; header x-clinic-ops-signature. */
export async function opsSignature(rawBody: string, secret: string): Promise<string> {
  return sha256(`${secret}\n${rawBody}`);
}

export async function acceptOpsStatus(
  repos: Repos,
  secret: string | undefined,
  rawBody: string,
  headerSig: string | null,
): Promise<
  { ok: true; data: OpsStatusHookBody } | { ok: false; status: 401 | 400; message: string }
> {
  if (!secret) {
    return { ok: false, status: 401, message: "Ops webhook is not configured." };
  }
  if (!headerSig) {
    return { ok: false, status: 401, message: "Missing signature." };
  }
  const expected = await opsSignature(rawBody, secret);
  if (!safeEqual(headerSig, expected)) {
    return { ok: false, status: 401, message: "Bad signature." };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    return { ok: false, status: 400, message: "Body must be JSON." };
  }
  const parsed = opsStatusHookBodySchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid ops status body." };
  }

  await repos.opsStatus.upsert({
    key: parsed.data.key,
    status: parsed.data.status,
    detail: parsed.data.detail,
    checkedAt: parsed.data.checkedAt,
    actorId: "system",
  });
  return { ok: true, data: parsed.data };
}
