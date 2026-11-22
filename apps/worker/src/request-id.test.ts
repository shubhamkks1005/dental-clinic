import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { makeEnv, ORIGIN } from "./testing/app-env";

// 1.4.7: every Worker reply carries the request id, so the screen can show an "Error ID".
const BOOM = "/api/staff/test-boom";
const app = createApp({
  extraPublic: [BOOM],
  extend: (a) =>
    a.get(BOOM, () => {
      throw new Error("detail that must not reach the screen");
    }),
});

afterEach(() => vi.restoreAllMocks());

describe("request id on every reply (1.4.7)", () => {
  it("uses Cloudflare's cf-ray when present", async () => {
    const { env } = makeEnv();
    const res = await app.request(
      `${ORIGIN}/api/staff/me`,
      { headers: { "cf-ray": "8c2a1b3c4d5e6f70-BOM" } },
      env,
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("x-request-id")).toBe("8c2a1b3c4d5e6f70-BOM");
  });

  it("is on 401, 403 (CSRF) and 404 replies and on /hooks", async () => {
    const { env } = makeEnv();
    const replies = await Promise.all([
      app.request(`${ORIGIN}/api/staff/me`, {}, env),
      app.request(`${ORIGIN}/api/staff/auth/logout`, { method: "POST" }, env),
      app.request(`${ORIGIN}/hooks/nothing`, {}, env),
    ]);
    expect(replies.map((r) => r.status)).toEqual([401, 403, 404]);
    for (const res of replies) expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("a crash replies with a plain sentence and the id, and logs only the error type and id", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { env } = makeEnv();
    const res = await app.request(`${ORIGIN}${BOOM}`, { headers: { "cf-ray": "abc123-DEL" } }, env);
    expect(res.status).toBe(500);
    expect(res.headers.get("x-request-id")).toBe("abc123-DEL");
    expect(JSON.stringify(await res.json())).not.toContain("detail that must not");
    expect(log).toHaveBeenCalledWith("unhandled error:", "Error", "abc123-DEL");
  });
});
