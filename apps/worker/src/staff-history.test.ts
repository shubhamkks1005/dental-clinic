import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p-hist', 'system', 'system', 'P-000101', 'Fake Hist One', 'female', 30, '+919000000101', 'active')`,
    )
    .run();
});

async function get(email: string, path: string) {
  const cookie = await sessionCookie(env, email);
  return app.request(`${ORIGIN}${path}`, { method: "GET", headers: { cookie } }, env);
}

describe("staff history summary (3.5.11)", () => {
  it("doctor and receptionist can load the summary", async () => {
    const doc = await get("doc@example.test", "/api/staff/patients/p-hist/history/summary");
    expect(doc.status).toBe(200);
    const body = (await doc.json()) as {
      data: { summary: { totalVisits: number; alertLabels: string[] } };
    };
    expect(body.data.summary.totalVisits).toBe(0);

    const rec = await get("rec@example.test", "/api/staff/patients/p-hist/history/summary");
    expect(rec.status).toBe(200);
  });
});
