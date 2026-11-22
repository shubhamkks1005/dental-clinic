import { shortRequestId } from "@clinic/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { makeEnv, ORIGIN } from "./testing/app-env";

// 1.4.7 + 1.6.1: every reply carries the request id; structured logs share it so an Error ID
// finds the full trail (request line + error line).
const BOOM = "/api/staff/test-boom";
const app = createApp({
  extraPublic: [BOOM],
  extend: (a) =>
    a.get(BOOM, () => {
      throw new Error("detail that must not reach the screen");
    }),
});

afterEach(() => vi.restoreAllMocks());

const parseLines = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map((c) => JSON.parse(String(c[0])) as Record<string, unknown>);

describe("request id on every reply (1.4.7)", () => {
  it("uses Cloudflare's cf-ray when present", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
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
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { env } = makeEnv();
    const replies = await Promise.all([
      app.request(`${ORIGIN}/api/staff/me`, {}, env),
      app.request(`${ORIGIN}/api/staff/auth/logout`, { method: "POST" }, env),
      app.request(`${ORIGIN}/hooks/nothing`, {}, env),
    ]);
    expect(replies.map((r) => r.status)).toEqual([401, 403, 404]);
    for (const res of replies) expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("a crash replies with a plain sentence; Error ID finds the request and error log lines", async () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { env } = makeEnv();
    const ray = "abc12345-DEL";
    const res = await app.request(
      `${ORIGIN}${BOOM}?search=Rohan`,
      { headers: { "cf-ray": ray } },
      env,
    );
    expect(res.status).toBe(500);
    expect(res.headers.get("x-request-id")).toBe(ray);
    expect(JSON.stringify(await res.json())).not.toContain("detail that must not");

    const needle = shortRequestId(ray);
    const trail = [...parseLines(info), ...parseLines(err)].filter(
      (line) =>
        String(line.requestId).includes(needle.toLowerCase()) ||
        String(line.requestId).toUpperCase().includes(needle),
    );
    // cf-ray "abc12345-DEL" -> short id ABC12345; both lines share the full request id.
    expect(trail.some((l) => l.msg === "request" && l.path === BOOM && l.status === 500)).toBe(
      true,
    );
    expect(trail.some((l) => l.msg === "unhandled" && l.err === "Error")).toBe(true);
    expect(JSON.stringify(trail)).not.toMatch(/Rohan|detail that must not/i);
  });
});
