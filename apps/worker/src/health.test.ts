import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { makeEnv } from "./testing/app-env";

describe("GET /api/staff/health (1.6.2)", () => {
  it("returns 200 with status and version when the database answers", async () => {
    const { env } = makeEnv({
      CF_VERSION_METADATA: { id: "deployid123456", tag: "staging-1" },
    });
    const res = await createApp().request("/api/staff/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { status: "ok", version: "staging-1" },
    });
  });

  it("returns 503 when the database does not answer", async () => {
    const { env } = makeEnv({
      DB: {
        prepare() {
          throw new Error("D1 unavailable");
        },
        batch() {
          throw new Error("D1 unavailable");
        },
      },
    });
    const res = await createApp().request("/api/staff/health", {}, env);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      ok: false,
      error: { code: "unhealthy" },
    });
  });
});
