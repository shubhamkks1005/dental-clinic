import { Hono } from "hono";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearJwksCache } from "../adapters/jwks";
import { makeSigner, nowSec, type TestSigner } from "../testing/jwt-fixtures";
import type { AppEnv } from "../types";
import { accessJwt } from "./access-jwt";

const TEAM = "clinic.cloudflareaccess.com";
const AUD = "aud-tag-123";

let signer: TestSigner;
beforeAll(async () => {
  signer = await makeSigner();
});
beforeEach(() => {
  clearJwksCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ keys: [signer.jwk] })),
  );
});
afterEach(() => vi.unstubAllGlobals());

const app = new Hono<AppEnv>();
app.use("/api/staff/*", accessJwt());
app.get("/api/staff/thing", (c) => c.text("ok"));
app.get("/api/staff/health", (c) => c.text("healthy"));

const on = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD } as unknown as Env;
const off = { ACCESS_TEAM_DOMAIN: "", ACCESS_AUD: "" } as unknown as Env;
const claims = (extra: object = {}) => ({
  iss: `https://${TEAM}`,
  aud: [AUD],
  exp: nowSec() + 300,
  ...extra,
});
const call = (env: Env, token?: string, path = "/api/staff/thing") =>
  app.request(path, { headers: token ? { "Cf-Access-Jwt-Assertion": token } : {} }, env);

describe("optional Cloudflare Access check (1.3.2)", () => {
  it("does nothing while ACCESS_* is empty (Access not set up)", async () => {
    expect((await call(off)).status).toBe(200);
  });

  it("when on: a missing token is 403", async () => {
    expect((await call(on)).status).toBe(403);
  });

  it("when on: a valid token passes", async () => {
    expect((await call(on, await signer.sign(claims()))).status).toBe(200);
  });

  it("when on: wrong audience and expired tokens are 403", async () => {
    expect((await call(on, await signer.sign(claims({ aud: ["other"] })))).status).toBe(403);
    expect((await call(on, await signer.sign(claims({ exp: nowSec() - 600 })))).status).toBe(403);
  });

  it("when on: the health check stays reachable (Access Bypass rule)", async () => {
    expect((await call(on, undefined, "/api/staff/health")).status).toBe(200);
  });
});
