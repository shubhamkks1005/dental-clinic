import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

// 1.5.1 settings store over HTTP. Fake staff only.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
let doctor: string;

const put = (key: string, cookie: string, body: unknown) => {
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}/api/staff/settings/${key}`,
    {
      ...init,
      method: "PUT",
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );
};
const prefix = () =>
  sqlite
    .prepare("SELECT value_json, version FROM settings WHERE key = 'patient_code.prefix'")
    .get();

beforeEach(async () => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc-a@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec-1@example.test", role: "receptionist" });
  doctor = await sessionCookie(env, "doc-a@example.test");
});

describe("settings store API (1.5.1)", () => {
  it("lists the settings with values and versions", async () => {
    const res = await app.request(
      `${ORIGIN}/api/staff/settings`,
      { headers: { cookie: doctor } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { settings: { key: string }[] } };
    expect(body.data.settings.map((s) => s.key)).toContain("patient_code.prefix");
  });

  it("a valid change saves and bumps the version", async () => {
    const res = await put("patient_code.prefix", doctor, { value: "PT-", version: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      data: { key: "patient_code.prefix", value: "PT-", version: 2 },
    });
    expect(prefix()).toEqual({ value_json: '"PT-"', version: 2 });
  });

  it("an invalid value is 400 with a plain sentence and nothing is saved", async () => {
    const res = await put("patient_code.prefix", doctor, { value: "p- x", version: 1 });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      ok: false,
      error: {
        code: "invalid",
        message: "Use 1 to 5 capital letters, digits or dashes, for example P-.",
      },
    });
    expect(prefix()).toEqual({ value_json: '"P-"', version: 1 });
    expect(sqlite.prepare("SELECT id FROM audit_log").all()).toHaveLength(0);
  });

  it("missing version 400, unknown key 404, stale version 409, receptionist 403", async () => {
    expect((await put("patient_code.prefix", doctor, { value: "PT-" })).status).toBe(400);
    expect((await put("nope", doctor, { value: 1, version: 1 })).status).toBe(404);
    expect((await put("patient_code.prefix", doctor, { value: "PT-", version: 5 })).status).toBe(
      409,
    );
    const receptionist = await sessionCookie(env, "rec-1@example.test");
    expect(
      (await put("patient_code.prefix", receptionist, { value: "PT-", version: 1 })).status,
    ).toBe(403);
    expect(prefix()).toEqual({ value_json: '"P-"', version: 1 });
  });
});
