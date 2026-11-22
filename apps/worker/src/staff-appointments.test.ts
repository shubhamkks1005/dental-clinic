import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

const VISIT_ID = "01M83VTYPE01CONSULT000001";

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

async function book(email: string, body: unknown) {
  const cookie = await sessionCookie(env, email);
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}/api/staff/appointments`,
    {
      ...init,
      method: "POST",
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );
}

describe("POST /api/staff/appointments (2.3.4)", () => {
  it("receptionist books; second overlap is 409 with one audit row", async () => {
    const body = {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      dateLocal: "2026-11-23",
      startMin: 600,
      source: "phone",
    };
    const first = await book("rec@example.test", body);
    expect(first.status).toBe(201);
    const second = await book("doc@example.test", body);
    expect(second.status).toBe(409);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 1 });
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()).toEqual({ n: 1 });
  });

  it("developer is refused; bad body is 400", async () => {
    expect(
      (
        await book("dev@example.test", {
          patientId: "p1",
          visitTypeId: VISIT_ID,
          dateLocal: "2026-11-23",
          startMin: 600,
          source: "phone",
        })
      ).status,
    ).toBe(403);
    expect((await book("rec@example.test", { patientId: "p1" })).status).toBe(400);
  });
});
