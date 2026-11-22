import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Med Hist', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function staffJson(email: string, method: string, path: string, body?: unknown) {
  const cookie = await sessionCookie(env, email);
  if (method === "GET") {
    return app.request(`${ORIGIN}${path}`, { method, headers: { cookie } }, env);
  }
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: body === undefined ? "{}" : JSON.stringify(body),
    },
    env,
  );
}

describe("staff medical history API (3.3.1)", () => {
  it("doctor saves and reads; receptionist is 403 on clinical history but can read alert flags", async () => {
    const saved = await staffJson(
      "doc@example.test",
      "POST",
      "/api/staff/patients/p1/medical-history",
      {
        items: [
          {
            code: "diabetes",
            label: "Diabetes",
            answer: "yes",
            alertLabel: "Diabetes",
          },
        ],
      },
    );
    expect(saved.status).toBe(201);

    const got = await staffJson(
      "doc@example.test",
      "GET",
      "/api/staff/patients/p1/medical-history",
    );
    expect(got.status).toBe(200);
    const body = (await got.json()) as {
      data: { history: { versionNo: number }; alerts: { label: string }[] };
    };
    expect(body.data.history.versionNo).toBe(1);
    expect(body.data.alerts[0]?.label).toBe("Diabetes");

    expect(
      (await staffJson("rec@example.test", "GET", "/api/staff/patients/p1/medical-history")).status,
    ).toBe(403);
    expect(
      (
        await staffJson("rec@example.test", "POST", "/api/staff/patients/p1/medical-history", {
          items: [{ code: "x", label: "X", answer: "no" }],
        })
      ).status,
    ).toBe(403);

    const flags = await staffJson("rec@example.test", "GET", "/api/staff/patients/p1/alert-flags");
    expect(flags.status).toBe(200);
    expect(
      ((await flags.json()) as { data: { flags: { hasAlert: boolean } } }).data.flags.hasAlert,
    ).toBe(true);
  });
});
