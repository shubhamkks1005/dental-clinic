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
       VALUES ('p-plan', 'system', 'system', 'P-000201', 'Fake Plan One', 'female', 30, '+919000000201', 'active')`,
    )
    .run();
});

async function get(email: string, path: string) {
  const cookie = await sessionCookie(env, email);
  return app.request(`${ORIGIN}${path}`, { method: "GET", headers: { cookie } }, env);
}

async function post(email: string, path: string, body: unknown) {
  const cookie = await sessionCookie(env, email);
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    { ...init, method: "POST", body: JSON.stringify(body) },
    env,
  );
}

async function patch(email: string, path: string, body: unknown) {
  const cookie = await sessionCookie(env, email);
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}${path}`,
    { ...init, method: "PATCH", body: JSON.stringify(body) },
    env,
  );
}

describe("staff plan items (3.6.1 / 3.6.2 / 3.6.5)", () => {
  it("doctor creates and lists; receptionist gets 403; accepted needs toldOn", async () => {
    const created = await post("doc@example.test", "/api/staff/plan-items", {
      patientId: "p-plan",
      procedureLabel: "Filling 36",
      estimatePaise: 150000,
      toothFdi: 36,
      phase: 1,
      sittings: 1,
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { data: { item: { id: string } } };
    const id = createdBody.data.item.id;

    const list = await get("doc@example.test", "/api/staff/patients/p-plan/plan-items");
    expect(list.status).toBe(200);

    const rec = await get("rec@example.test", "/api/staff/patients/p-plan/plan-items");
    expect(rec.status).toBe(403);

    const bad = await patch("doc@example.test", `/api/staff/plan-items/${id}/decision`, {
      status: "accepted",
      version: 1,
    });
    expect(bad.status).toBe(400);

    const okDecision = await patch("doc@example.test", `/api/staff/plan-items/${id}/decision`, {
      status: "accepted",
      toldOn: "2026-11-22",
      version: 1,
    });
    expect(okDecision.status).toBe(200);

    const noReason = await patch("doc@example.test", `/api/staff/plan-items/${id}/estimate`, {
      estimatePaise: 200000,
      reason: "",
      version: 2,
    });
    expect(noReason.status).toBe(400);
  });
});
