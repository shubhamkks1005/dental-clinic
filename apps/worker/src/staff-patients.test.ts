import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  addStaff(sqlite, { id: "dev-1", email: "dev@example.test", role: "developer" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function get(email: string) {
  const cookie = await sessionCookie(env, email);
  return app.request(
    `${ORIGIN}/api/staff/patients?page=1&pageSize=25`,
    { headers: { cookie } },
    env,
  );
}

describe("GET /api/staff/patients (1.1.7)", () => {
  it("returns a page for doctor and receptionist", async () => {
    for (const email of ["doc@example.test", "rec@example.test"]) {
      const res = await get(email);
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: true;
        data: { page: { total: number; rows: { code: string }[] } };
      };
      expect(body.data.page.total).toBe(1);
      expect(body.data.page.rows[0]?.code).toBe("P-000001");
    }
  });

  it("refuses developer", async () => {
    expect((await get("dev@example.test")).status).toBe(403);
  });
});

describe("POST /api/staff/patients/duplicate-check (2.1.7)", () => {
  it("returns soft warnings for doctor", async () => {
    const cookie = await sessionCookie(env, "doc@example.test");
    const init = sameOriginPost(cookie);
    const res = await app.request(
      `${ORIGIN}/api/staff/patients/duplicate-check`,
      {
        ...init,
        method: "POST",
        headers: {
          ...(init.headers as Record<string, string>),
          "content-type": "application/json",
        },
        body: JSON.stringify({ fullName: "Other Fake", mobile: "9000009999", ageYearsAtReg: 30 }),
      },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: true; data: { warnings: unknown[] } };
    expect(body.data.warnings).toEqual([]);
  });
});
