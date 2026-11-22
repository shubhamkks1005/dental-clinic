import { createDb } from "@clinic/db";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addStaff, makeEnv } from "../testing/app-env";
import { makeSigner, nowSec, type TestSigner } from "../testing/jwt-fixtures";
import { sha256 } from "./auth-crypto";
import { verifyRs256 } from "./jwt";
import { finishLogin, startLogin, type AuthConfig, type GoogleClient } from "./login";

const config: AuthConfig = {
  clientId: "client-123",
  redirectUri: "https://clinic.test/api/staff/auth/callback",
  cookieSecret: "cookie-secret",
};

let signer: TestSigner;
let t: ReturnType<typeof makeEnv>;
beforeAll(async () => {
  signer = await makeSigner();
});
beforeEach(() => {
  t = makeEnv();
});

const rows = (sqlText: string) => t.sqlite.prepare(sqlText).all();

// Starts a real flow, then plays Google: returns a signed ID token for these claims.
async function callback(claimsFor: (nonce: string) => object, overrides: object = {}) {
  const { redirectTo, flowCookie } = await startLogin(config, Date.now());
  const params = new URL(redirectTo).searchParams;
  const nonce = params.get("nonce")!;
  const google: GoogleClient = {
    exchangeCode: async () => signer.sign(claimsFor(nonce)),
    verifyIdToken: (token) => verifyRs256(token, [signer.jwk]),
  };
  return finishLogin(
    { db: createDb(t.env.DB), google, config, nowMs: Date.now() },
    {
      code: "code-1",
      state: params.get("state")!,
      flowCookie,
      userAgent: "ua",
      requestId: "r",
      ...overrides,
    },
  );
}

const googleClaims =
  (email: string, sub = "sub-1", extra: object = {}) =>
  (nonce: string) => ({
    iss: "https://accounts.google.com",
    aud: "client-123",
    exp: nowSec() + 300,
    iat: nowSec(),
    nonce,
    sub,
    email,
    email_verified: true,
    ...extra,
  });

describe("finishLogin (1.3.8)", () => {
  it("signs in a listed doctor, binds the Google sub and stores only the token hash", async () => {
    addStaff(t.sqlite, { id: "u1", email: "doc@example.com" });
    const result = await callback(googleClaims("Doc@Example.com"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(rows("SELECT google_sub FROM users")).toEqual([{ google_sub: "sub-1" }]);
    expect(rows("SELECT token_hash FROM staff_sessions")).toEqual([
      { token_hash: await sha256(result.sessionToken) },
    ]);
    expect(rows("SELECT action FROM access_log")).toEqual([{ action: "login" }]);
  });

  it("an unknown Gmail is denied, logged with a masked email, and gets no session", async () => {
    expect((await callback(googleClaims("stranger@gmail.com"))).ok).toBe(false);
    expect(rows("SELECT action, created_by, detail FROM access_log")).toEqual([
      { action: "login_denied", created_by: "anonymous", detail: "unknown s***@gmail.com" },
    ]);
    expect(rows("SELECT * FROM staff_sessions")).toHaveLength(0);
  });

  it("deactivated staff, a different Google account for the same email, and unverified email are denied", async () => {
    addStaff(t.sqlite, { id: "u1", email: "gone@example.com", status: "disabled" });
    addStaff(t.sqlite, { id: "u2", email: "doc@example.com", sub: "original-sub" });
    expect((await callback(googleClaims("gone@example.com"))).ok).toBe(false);
    expect((await callback(googleClaims("doc@example.com", "other-sub"))).ok).toBe(false);
    expect(
      (await callback(googleClaims("doc@example.com", "original-sub", { email_verified: false })))
        .ok,
    ).toBe(false);
    expect(rows("SELECT detail FROM access_log ORDER BY detail").map((r) => r.detail)).toEqual([
      "disabled g***@example.com",
      "email_unverified",
      "sub_mismatch d***@example.com",
    ]);
    expect(rows("SELECT * FROM staff_sessions")).toHaveLength(0);
  });

  it("a wrong nonce or a wrong state fails and is logged", async () => {
    addStaff(t.sqlite, { id: "u1", email: "doc@example.com" });
    expect((await callback(() => googleClaims("doc@example.com")("not-the-nonce"))).ok).toBe(false);
    expect((await callback(googleClaims("doc@example.com"), { state: "forged" })).ok).toBe(false);
    expect(rows("SELECT action, detail FROM access_log ORDER BY detail")).toEqual([
      { action: "login_failed", detail: "nonce" },
      { action: "login_failed", detail: "state" },
    ]);
  });

  it("without a valid signed flow cookie nothing is written at all (bot protection)", async () => {
    expect((await callback(googleClaims("x@example.com"), { flowCookie: undefined })).ok).toBe(
      false,
    );
    expect(
      (await callback(googleClaims("x@example.com"), { flowCookie: "forged.cookie" })).ok,
    ).toBe(false);
    expect(rows("SELECT * FROM access_log")).toHaveLength(0);
  });

  it("a Google error on the way back is logged as a failure", async () => {
    expect((await callback(googleClaims("x@example.com"), { error: "access_denied" })).ok).toBe(
      false,
    );
    expect(rows("SELECT action, detail FROM access_log")).toEqual([
      { action: "login_failed", detail: "google: access_denied" },
    ]);
  });
});
