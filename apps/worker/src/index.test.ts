import { describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";

const notFound = {
  ok: false,
  error: { code: "not_found", message: "This address does not exist." },
};

describe("route groups", () => {
  it.each(["/api/staff/anything", "/api/portal/anything", "/api/other/x"])(
    "%s for a signed-in user is the JSON 404 shape, not the web app",
    async (path) => {
      const { env, sqlite, assetsFetch } = makeEnv();
      addStaff(sqlite, { id: "u1", email: "doc@example.com" });
      const cookie = await sessionCookie(env, "doc@example.com");
      const res = await app.request(`${ORIGIN}${path}`, { headers: { cookie } }, env);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual(notFound);
      expect(assetsFetch).not.toHaveBeenCalled();
    },
  );

  it("/hooks/* needs no staff session (webhooks are signed) and unknown hooks are 404", async () => {
    const { env } = makeEnv();
    const res = await app.request(`${ORIGIN}/hooks/anything`, {}, env);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(notFound);
  });

  it.each(["/app", "/app/patients/1", "/my", "/my/bills", "/", "/application"])(
    "%s is handed to the static assets",
    async (path) => {
      const { env, assetsFetch } = makeEnv();
      const res = await app.request(`${ORIGIN}${path}`, {}, env);
      expect(await res.text()).toBe("asset");
      expect(assetsFetch).toHaveBeenCalledOnce();
    },
  );
});
