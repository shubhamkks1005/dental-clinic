import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { PUBLIC_API } from "./public-routes";
import { makeEnv, ORIGIN } from "./testing/app-env";

// Deny by default (1.3.8): walk every registered /api route of the staging/production app and
// call it without a session. Only the explicit public list may answer with anything but 401.
const app = createApp();
const apiRoutes = app.routes.filter((r) => r.method !== "ALL" && r.path.startsWith("/api/"));
const isPublic = (path: string) => (PUBLIC_API as readonly string[]).includes(path);
const concrete = (path: string) => path.replace(/:[^/]+/g, "x").replace(/\*/g, "x");

describe("deny by default", () => {
  it("the public list is exactly the four agreed paths", () => {
    expect([...PUBLIC_API].sort()).toEqual([
      "/api/staff/auth/branding",
      "/api/staff/auth/callback",
      "/api/staff/auth/start",
      "/api/staff/health",
    ]);
  });

  it("finds the registered routes (the walk is not empty)", () => {
    expect(apiRoutes.map((r) => r.path)).toEqual(
      expect.arrayContaining(["/api/staff/me", "/api/staff/auth/logout"]),
    );
  });

  it.each(apiRoutes.filter((r) => !isPublic(r.path)).map((r) => [r.method, r.path] as const))(
    "%s %s answers 401 without a session",
    async (method, path) => {
      const { env } = makeEnv();
      const res = await app.request(
        `${ORIGIN}${concrete(path)}`,
        { method, headers: { origin: ORIGIN, "x-clinic-request": "1" } },
        env,
      );
      expect(res.status).toBe(401);
    },
  );

  it("an unknown /api path is also 401 without a session (routes are not revealed)", async () => {
    const { env } = makeEnv();
    expect((await app.request(`${ORIGIN}/api/staff/made-up`, {}, env)).status).toBe(401);
    expect((await app.request(`${ORIGIN}/api/portal/anything`, {}, env)).status).toBe(401);
  });

  it("every public route answers without a session", async () => {
    const { env } = makeEnv();
    for (const path of PUBLIC_API) {
      expect((await app.request(`${ORIGIN}${path}`, {}, env)).status).not.toBe(401);
    }
  });
});
