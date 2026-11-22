import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { authConfig, loginDeps } from "../auth-deps";
import { LOGIN_FLOW_MS, SESSION_ABSOLUTE_MS } from "../domain/auth";
import { buildVersion, checkHealth } from "../domain/health";
import { clinicBranding, finishLogin, logout, startLogin } from "../domain/login";
import { meView } from "../domain/me";
import { COOKIE_BASE, signedIn } from "../http";
import { FLOW_COOKIE, SESSION_COOKIE } from "../public-routes";
import type { AppEnv } from "../types";

// Staff sign-in (docs/AUTH_PLAN.md). Public: health, auth/branding, auth/start, auth/callback.
export const staffAuth = new Hono<AppEnv>();

// 1.6.2: DB ping + build version. Path stays /api/staff/health (public list / AUTH_PLAN).
staffAuth.get("/health", async (c) => {
  const version = buildVersion(c.env.CF_VERSION_METADATA);
  const result = await checkHealth(c.var.db, version);
  if (!result.ok) return c.json(fail("unhealthy", result.message), 503);
  return c.json(ok(result.data));
});

staffAuth.get("/auth/branding", async (c) => c.json(ok(await clinicBranding(c.var.db))));

staffAuth.get("/auth/start", async (c) => {
  const config = authConfig(c.env);
  if (!config) {
    return c.json(
      fail("not_configured", "Google sign-in is not set up yet. Please tell the developer."),
      503,
    );
  }
  const { redirectTo, flowCookie } = await startLogin(config, Date.now());
  setCookie(c, FLOW_COOKIE, flowCookie, { ...COOKIE_BASE, maxAge: LOGIN_FLOW_MS / 1000 });
  return c.redirect(redirectTo, 302);
});

staffAuth.get("/auth/callback", async (c) => {
  const config = authConfig(c.env);
  if (!config) return c.redirect("/denied", 302);
  const result = await finishLogin(loginDeps(c.env, c.var.db, config), {
    code: c.req.query("code"),
    state: c.req.query("state"),
    error: c.req.query("error"),
    flowCookie: getCookie(c, FLOW_COOKIE, "host"),
    userAgent: c.req.header("user-agent") ?? null,
    requestId: c.var.requestId,
  });
  deleteCookie(c, FLOW_COOKIE, COOKIE_BASE);
  if (!result.ok) return c.redirect("/denied", 302);
  setCookie(c, SESSION_COOKIE, result.sessionToken, {
    ...COOKIE_BASE,
    maxAge: SESSION_ABSOLUTE_MS / 1000,
  });
  return c.redirect("/app", 302);
});

staffAuth.post("/auth/logout", async (c) => {
  const { session, ctx } = signedIn(c);
  await logout(c.var.db, session.sessionId, ctx);
  deleteCookie(c, SESSION_COOKIE, COOKIE_BASE);
  return c.json(ok({ signedOut: true }));
});

staffAuth.get("/me", (c) => c.json(ok(meView(signedIn(c).session))));
