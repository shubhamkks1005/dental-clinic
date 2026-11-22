import { describe, expect, it } from "vitest";
import {
  checkGoogleIdToken,
  checkSession,
  decideLogin,
  googleAuthorizeUrl,
  isLoginFlow,
  maskEmail,
  needsTouch,
  SESSION_IDLE_MS,
} from "./auth";
import { seal, unseal } from "./auth-crypto";

const nowSec = () => Math.floor(Date.now() / 1000);
const claims = (extra: object = {}) => ({
  iss: "https://accounts.google.com",
  aud: "client-1",
  azp: "client-1",
  exp: nowSec() + 300,
  iat: nowSec(),
  nonce: "n-1",
  sub: "sub-1",
  email: "Doc@Example.com",
  email_verified: true,
  ...extra,
});
const rules = { clientId: "client-1", nonce: "n-1", nowSec: nowSec() };

describe("sign-in flow cookie", () => {
  it("round-trips and refuses tampering, a wrong secret and expiry", async () => {
    const flow = { state: "s", nonce: "n", verifier: "v", exp: Date.now() + 60_000 };
    const sealed = await seal(flow, "secret");
    expect(isLoginFlow(await unseal(sealed, "secret"), Date.now())).toBe(true);
    expect(await unseal(sealed, "other-secret")).toBeNull();
    expect(await unseal(`${sealed.slice(0, -2)}xx`, "secret")).toBeNull();
    expect(isLoginFlow(await unseal(sealed, "secret"), Date.now() + 120_000)).toBe(false);
  });
});

describe("googleAuthorizeUrl", () => {
  it("asks only for openid + email, uses PKCE S256 and always shows the account chooser", () => {
    const url = new URL(
      googleAuthorizeUrl({
        clientId: "c",
        redirectUri: "https://x/cb",
        state: "s",
        nonce: "n",
        challenge: "ch",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: "code",
      scope: "openid email",
      code_challenge_method: "S256",
      code_challenge: "ch",
      prompt: "select_account",
      state: "s",
      nonce: "n",
    });
  });
});

describe("checkGoogleIdToken", () => {
  it("accepts good claims and lowercases the email", () => {
    expect(checkGoogleIdToken(claims(), rules)).toEqual({
      ok: true,
      sub: "sub-1",
      email: "doc@example.com",
    });
  });

  it("accepts the short issuer form too", () => {
    expect(checkGoogleIdToken(claims({ iss: "accounts.google.com" }), rules).ok).toBe(true);
  });

  it("refuses wrong audience, azp, nonce, expired and unverified email", () => {
    expect(checkGoogleIdToken(claims({ aud: "other" }), rules)).toMatchObject({
      ok: false,
      reason: "aud",
    });
    expect(checkGoogleIdToken(claims({ azp: "other" }), rules)).toMatchObject({
      ok: false,
      reason: "azp",
    });
    expect(checkGoogleIdToken(claims({ nonce: "x" }), rules)).toMatchObject({
      ok: false,
      reason: "nonce",
    });
    expect(checkGoogleIdToken(claims({ exp: nowSec() - 600 }), rules)).toMatchObject({
      ok: false,
      reason: "exp",
    });
    expect(checkGoogleIdToken(claims({ email_verified: false }), rules)).toEqual({
      ok: false,
      reason: "email_unverified",
      denied: true,
    });
    expect(checkGoogleIdToken(claims({ email_verified: "true" }), rules).ok).toBe(false);
  });
});

describe("decideLogin", () => {
  it("binds on first sign-in, accepts the same sub later, refuses others", () => {
    expect(decideLogin(undefined, "s")).toEqual({ allow: false, reason: "unknown" });
    expect(decideLogin({ status: "disabled", googleSub: null }, "s")).toEqual({
      allow: false,
      reason: "disabled",
    });
    expect(decideLogin({ status: "active", googleSub: null }, "s")).toEqual({
      allow: true,
      bindSub: "s",
    });
    expect(decideLogin({ status: "active", googleSub: "s" }, "s")).toEqual({
      allow: true,
      bindSub: null,
    });
    expect(decideLogin({ status: "active", googleSub: "s" }, "x")).toEqual({
      allow: false,
      reason: "sub_mismatch",
    });
  });
});

describe("sessions", () => {
  const now = Date.parse("2026-11-22T10:00:00.000Z");
  const session = (extra: object = {}) => ({
    expiresAt: "2026-11-22T20:00:00.000Z",
    lastSeenAt: "2026-11-22T09:50:00.000Z",
    revokedAt: null,
    user: { status: "active" as const, deletedAt: null },
    ...extra,
  });

  it("is valid inside 12 h and 60 min idle; otherwise says why not", () => {
    expect(checkSession(session(), now)).toBe("valid");
    expect(checkSession(session({ revokedAt: "2026-11-22T09:55:00.000Z" }), now)).toBe("revoked");
    expect(checkSession(session({ expiresAt: "2026-11-22T10:00:00.000Z" }), now)).toBe("expired");
    const idle = new Date(now - SESSION_IDLE_MS).toISOString();
    expect(checkSession(session({ lastSeenAt: idle }), now)).toBe("idle");
    expect(checkSession(session({ user: { status: "disabled", deletedAt: null } }), now)).toBe(
      "user_inactive",
    );
  });

  it("touches last_seen only when it is 5 minutes old or more", () => {
    expect(needsTouch("2026-11-22T09:56:00.000Z", now)).toBe(false);
    expect(needsTouch("2026-11-22T09:55:00.000Z", now)).toBe(true);
  });
});

describe("maskEmail", () => {
  it("keeps only the first letter and the domain", () => {
    expect(maskEmail("nidhi@gmail.com")).toBe("n***@gmail.com");
  });
});
