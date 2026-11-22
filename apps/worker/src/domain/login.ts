import { authRepo, type Db, type SessionRow, type StaffUser } from "@clinic/db";
import type { VerifyResult } from "./jwt";
import {
  checkGoogleIdToken,
  checkSession,
  decideLogin,
  googleAuthorizeUrl,
  isLoginFlow,
  LOGIN_FLOW_MS,
  maskEmail,
  needsTouch,
  sessionExpiry,
  type LoginFlow,
} from "./auth";
import { randomToken, safeEqual, seal, sha256, unseal } from "./auth-crypto";

// The sign-in steps. Google and the database are passed in, so tests can use fakes.
export type GoogleClient = {
  exchangeCode(input: { code: string; verifier: string; redirectUri: string }): Promise<string>;
  verifyIdToken(idToken: string): Promise<VerifyResult>;
};

export type AuthConfig = { clientId: string; redirectUri: string; cookieSecret: string };

export async function startLogin(config: AuthConfig, nowMs: number) {
  const flow: LoginFlow = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(),
    exp: nowMs + LOGIN_FLOW_MS,
  };
  const redirectTo = googleAuthorizeUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state: flow.state,
    nonce: flow.nonce,
    challenge: await sha256(flow.verifier),
  });
  return { redirectTo, flowCookie: await seal(flow, config.cookieSecret) };
}

export type CallbackInput = {
  code?: string;
  state?: string;
  error?: string;
  flowCookie?: string;
  userAgent: string | null;
  requestId: string;
};

type Deps = { db: Db; google: GoogleClient; config: AuthConfig; nowMs: number };

// Every failure returns { ok: false } and the caller shows the same "Access not available" page.
// Nothing is written unless the signed flow cookie is valid, so bots cannot fill access_log.
export async function finishLogin(deps: Deps, input: CallbackInput) {
  const repo = authRepo(deps.db);
  const flow = input.flowCookie ? await unseal(input.flowCookie, deps.config.cookieSecret) : null;
  if (!isLoginFlow(flow, deps.nowMs)) return { ok: false } as const;

  const failed = async (action: "login_failed" | "login_denied", detail: string) => {
    await repo.recordLoginProblem(action, detail.slice(0, 120), input.requestId);
    return { ok: false } as const;
  };
  if (input.error) return failed("login_failed", `google: ${input.error.replace(/[^a-z_]/gi, "")}`);
  if (!input.state || !safeEqual(input.state, flow.state)) return failed("login_failed", "state");
  if (!input.code) return failed("login_failed", "no code");

  let idToken: string;
  try {
    idToken = await deps.google.exchangeCode({
      code: input.code,
      verifier: flow.verifier,
      redirectUri: deps.config.redirectUri,
    });
  } catch {
    return failed("login_failed", "token exchange");
  }
  const verified = await deps.google.verifyIdToken(idToken);
  if (!verified.ok) return failed("login_failed", `id token ${verified.reason}`);
  const claims = checkGoogleIdToken(verified.payload, {
    clientId: deps.config.clientId,
    nonce: flow.nonce,
    nowSec: Math.floor(deps.nowMs / 1000),
  });
  if (!claims.ok) return failed(claims.denied ? "login_denied" : "login_failed", claims.reason);

  const user = await repo.findStaffByEmail(claims.email);
  const decision = decideLogin(user, claims.sub);
  if (!user || !decision.allow) {
    const reason = decision.allow ? "unknown" : decision.reason;
    return failed("login_denied", `${reason} ${maskEmail(claims.email)}`);
  }

  const sessionToken = await openSession(deps.db, user, decision.bindSub, input, deps.nowMs);
  return { ok: true, sessionToken } as const;
}

// New random token per sign-in (no session fixation); only its hash is stored.
export async function openSession(
  db: Db,
  user: StaffUser,
  bindSub: string | null,
  request: { userAgent: string | null; requestId: string },
  nowMs: number,
): Promise<string> {
  const sessionToken = randomToken();
  await authRepo(db).completeLogin({
    user,
    bindSub,
    tokenHash: await sha256(sessionToken),
    expiresAt: sessionExpiry(nowMs),
    userAgent: request.userAgent?.slice(0, 200) ?? null,
    requestId: request.requestId,
  });
  return sessionToken;
}

// timedOut: the session ended by the idle or 12 h limit, so the screen can say why.
export type CurrentSession = { ok: true; session: SessionRow } | { ok: false; timedOut: boolean };

export async function currentSession(
  db: Db,
  token: string,
  nowMs: number,
): Promise<CurrentSession> {
  const repo = authRepo(db);
  const session = await repo.findSession(await sha256(token));
  if (!session) return { ok: false, timedOut: false };
  const check = checkSession(session, nowMs);
  if (check !== "valid") return { ok: false, timedOut: check === "idle" || check === "expired" };
  if (needsTouch(session.lastSeenAt, nowMs)) await repo.touchSession(session.sessionId);
  return { ok: true, session };
}

export async function logout(
  db: Db,
  sessionId: string,
  actor: { userId: string; requestId: string },
) {
  await authRepo(db).logout(sessionId, actor);
}

export const clinicBranding = (db: Db) => authRepo(db).branding();
