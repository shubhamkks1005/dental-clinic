import type { UserStatus } from "@clinic/shared";
import { checkStandardClaims, type JwtPayload } from "./jwt";

// Staff sign-in rules (docs/AUTH_PLAN.md). Pure functions; no I/O.
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 60 * 60 * 1000;
export const TOUCH_EVERY_MS = 5 * 60 * 1000;
export const LOGIN_FLOW_MS = 10 * 60 * 1000;

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;

export type LoginFlow = { state: string; nonce: string; verifier: string; exp: number };

export function isLoginFlow(value: unknown, nowMs: number): value is LoginFlow {
  const f = value as Partial<LoginFlow> | null;
  return (
    typeof f?.state === "string" &&
    typeof f.nonce === "string" &&
    typeof f.verifier === "string" &&
    typeof f.exp === "number" &&
    f.exp > nowMs
  );
}

type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  challenge: string;
};

export function googleAuthorizeUrl(p: AuthorizeParams): string {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    scope: "openid email",
    state: p.state,
    nonce: p.nonce,
    code_challenge: p.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTHORIZE_URL}?${query.toString()}`;
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

// For logs: first letter and domain only, e.g. n***@gmail.com.
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

export type GoogleClaimsResult =
  { ok: true; sub: string; email: string } | { ok: false; reason: string; denied: boolean };

// Standard claims + Google rules. denied = the account is fine but not allowed (unverified email).
export function checkGoogleIdToken(
  payload: JwtPayload,
  rules: { clientId: string; nonce: string; nowSec: number },
): GoogleClaimsResult {
  const standard = checkStandardClaims(payload, {
    issuers: GOOGLE_ISSUERS,
    audience: rules.clientId,
    nowSec: rules.nowSec,
  });
  if (standard) return { ok: false, reason: standard, denied: false };
  if (payload.azp !== undefined && payload.azp !== rules.clientId)
    return { ok: false, reason: "azp", denied: false };
  if (payload.nonce !== rules.nonce) return { ok: false, reason: "nonce", denied: false };
  if (typeof payload.sub !== "string" || typeof payload.email !== "string")
    return { ok: false, reason: "claims", denied: false };
  if (payload.email_verified !== true)
    return { ok: false, reason: "email_unverified", denied: true };
  return { ok: true, sub: payload.sub, email: normaliseEmail(payload.email) };
}

export type LoginDecision =
  | { allow: true; bindSub: string | null }
  | { allow: false; reason: "unknown" | "disabled" | "sub_mismatch" };

export function decideLogin(
  user: { status: UserStatus; googleSub: string | null } | undefined,
  sub: string,
): LoginDecision {
  if (!user) return { allow: false, reason: "unknown" };
  if (user.status !== "active") return { allow: false, reason: "disabled" };
  if (user.googleSub === null) return { allow: true, bindSub: sub };
  return user.googleSub === sub
    ? { allow: true, bindSub: null }
    : { allow: false, reason: "sub_mismatch" };
}

export type SessionFacts = {
  expiresAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  user: { status: UserStatus; deletedAt: string | null };
};

export type SessionCheck = "valid" | "revoked" | "expired" | "idle" | "user_inactive";

export function checkSession(s: SessionFacts, nowMs: number): SessionCheck {
  if (s.revokedAt) return "revoked";
  if (s.user.status !== "active" || s.user.deletedAt) return "user_inactive";
  if (nowMs >= Date.parse(s.expiresAt)) return "expired";
  if (nowMs - Date.parse(s.lastSeenAt) >= SESSION_IDLE_MS) return "idle";
  return "valid";
}

// last_seen_at is written at most once per 5 minutes per session (saves D1 writes).
export const needsTouch = (lastSeenAt: string, nowMs: number) =>
  nowMs - Date.parse(lastSeenAt) >= TOUCH_EVERY_MS;

export const sessionExpiry = (nowMs: number) => new Date(nowMs + SESSION_ABSOLUTE_MS).toISOString();
