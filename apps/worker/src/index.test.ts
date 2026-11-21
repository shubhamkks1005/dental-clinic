import { describe, expect, it, vi } from "vitest";
import app from "./index";

function fakeEnv() {
  const assetsFetch = vi.fn(async () => new Response("asset"));
  const env = { ASSETS: { fetch: assetsFetch } } as unknown as Env;
  return { env, assetsFetch };
}

describe("route groups", () => {
  it.each(["/api/staff/anything", "/api/portal/anything", "/hooks/anything", "/api/other/x"])(
    "%s answers with the JSON error shape, not the web app",
    async (path) => {
      const { env, assetsFetch } = fakeEnv();
      const res = await app.request(path, {}, env);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
        ok: false,
        error: { code: "not_found", message: "This address does not exist." },
      });
      expect(assetsFetch).not.toHaveBeenCalled();
    },
  );

  it.each(["/app", "/app/patients/1", "/my", "/my/bills", "/", "/application"])(
    "%s is handed to the static assets",
    async (path) => {
      const { env, assetsFetch } = fakeEnv();
      const res = await app.request(path, {}, env);
      expect(await res.text()).toBe("asset");
      expect(assetsFetch).toHaveBeenCalledOnce();
    },
  );
});
