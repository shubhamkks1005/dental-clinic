import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let t: ReturnType<typeof makeEnv>;
beforeEach(() => {
  t = makeEnv();
  addStaff(t.sqlite, { id: "u1", email: "doc@example.com" });
});

const get = (path: string, cookie?: string) =>
  app.request(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} }, t.env);
const setSession = (sql: string) => t.sqlite.exec(`UPDATE staff_sessions SET ${sql}`);
const lastSeen = () => t.sqlite.prepare("SELECT last_seen_at AS v FROM staff_sessions").get()?.v;

describe("staff session (1.3.8)", () => {
  it("no cookie: 401 with a plain message", async () => {
    const res = await get("/api/staff/me");
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: "not_signed_in" } });
  });

  it("a valid session gets name, role and permissions", async () => {
    const res = await get("/api/staff/me", await sessionCookie(t.env, "doc@example.com"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { name: string; role: string; permissions: string[] };
    };
    expect(body.data).toMatchObject({ name: "Test doctor", role: "doctor" });
    expect(body.data.permissions).toContain("settings.write");
  });

  it("expired (12 h), idle (60 min), revoked and deactivated sessions are all 401", async () => {
    const cookie = await sessionCookie(t.env, "doc@example.com");
    setSession("expires_at = '2020-01-01T00:00:00.000Z'");
    expect((await get("/api/staff/me", cookie)).status).toBe(401);
    setSession(
      `expires_at = '2099-01-01T00:00:00.000Z', last_seen_at = '${new Date(Date.now() - 61 * 60_000).toISOString()}'`,
    );
    expect((await get("/api/staff/me", cookie)).status).toBe(401);
    setSession(
      `last_seen_at = '${new Date().toISOString()}', revoked_at = '2026-01-01T00:00:00.000Z'`,
    );
    expect((await get("/api/staff/me", cookie)).status).toBe(401);
    setSession("revoked_at = NULL");
    t.sqlite.exec("UPDATE users SET status = 'disabled'");
    expect((await get("/api/staff/me", cookie)).status).toBe(401);
  });

  it("writes last_seen only when it is 5 minutes old or more", async () => {
    const cookie = await sessionCookie(t.env, "doc@example.com");
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    setSession(`last_seen_at = '${oneMinuteAgo}'`);
    await get("/api/staff/me", cookie);
    expect(lastSeen()).toBe(oneMinuteAgo);
    setSession(`last_seen_at = '${new Date(Date.now() - 10 * 60_000).toISOString()}'`);
    await get("/api/staff/me", cookie);
    expect(Date.parse(String(lastSeen()))).toBeGreaterThan(Date.now() - 5_000);
  });

  it("logout revokes the session on the server and logs it", async () => {
    const cookie = await sessionCookie(t.env, "doc@example.com");
    const res = await app.request(`${ORIGIN}/api/staff/auth/logout`, sameOriginPost(cookie), t.env);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/__Host-staff_session=;/);
    expect((await get("/api/staff/me", cookie)).status).toBe(401);
    expect(
      t.sqlite.prepare("SELECT action FROM access_log WHERE action = 'logout'").all(),
    ).toHaveLength(1);
  });
});

describe("CSRF on state-changing calls (1.3.8)", () => {
  it("blocks a POST without our Origin or without the custom header", async () => {
    const cookie = await sessionCookie(t.env, "doc@example.com");
    const url = `${ORIGIN}/api/staff/auth/logout`;
    const noOrigin = await app.request(
      url,
      { method: "POST", headers: { cookie, "x-clinic-request": "1" } },
      t.env,
    );
    const badOrigin = await app.request(
      url,
      {
        method: "POST",
        headers: { cookie, origin: "https://evil.example", "x-clinic-request": "1" },
      },
      t.env,
    );
    const noHeader = await app.request(
      url,
      { method: "POST", headers: { cookie, origin: ORIGIN } },
      t.env,
    );
    expect([noOrigin.status, badOrigin.status, noHeader.status]).toEqual([403, 403, 403]);
  });
});

describe("public sign-in endpoints (1.3.8)", () => {
  it("health and branding answer without a session; branding has only name and logo", async () => {
    expect((await get("/api/staff/health")).status).toBe(200);
    const branding = await get("/api/staff/auth/branding");
    expect(await branding.json()).toEqual({
      ok: true,
      data: { clinicName: "Align Dentistry", logo: null },
    });
  });

  it("start redirects to Google and sets a short-lived __Host- flow cookie", async () => {
    const res = await get("/api/staff/auth/start");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(
      /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/,
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^__Host-staff_oauth=/);
    expect(cookie).toMatch(/Max-Age=600/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it("start says plainly when Google sign-in is not set up", async () => {
    t = makeEnv({ GOOGLE_CLIENT_ID: "" });
    const res = await get("/api/staff/auth/start");
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: "not_configured" } });
  });

  it("a callback without the flow cookie goes to the Access not available page", async () => {
    const res = await get("/api/staff/auth/callback?code=x&state=y");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/denied");
  });
});
