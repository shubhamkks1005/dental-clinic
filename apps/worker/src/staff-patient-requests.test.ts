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
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Request One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function call(email: string, method: "GET" | "POST", path: string, body?: unknown) {
  const cookie = await sessionCookie(env, email);
  const url = `${ORIGIN}/api/staff/patient-requests${path}`;
  if (method === "GET") return app.request(url, { method, headers: { cookie } }, env);
  const init = sameOriginPost(cookie);
  return app.request(
    url,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
    env,
  );
}

type Json = { data: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any

async function intake(note = "Fake note with a fake tooth detail") {
  const res = await call("rec@example.test", "POST", "", {
    patientId: "p1",
    type: "copy",
    body: note,
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as Json).data.id as string;
}

describe("patient requests API (8.2.11)", () => {
  it("receptionist takes a request in and sees the list without the note", async () => {
    await intake();
    const res = await call("rec@example.test", "GET", "?status=open");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("P-000001");
    expect(text).not.toContain("tooth");
  });

  it("only the doctor opens the note, and that view is logged", async () => {
    const id = await intake();
    expect((await call("rec@example.test", "GET", `/${id}`)).status).toBe(403);
    const res = await call("doc@example.test", "GET", `/${id}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).toContain("tooth");
    const n = sqlite
      .prepare("SELECT COUNT(*) n FROM access_log WHERE resource = 'patient_request'")
      .get() as { n: number };
    expect(n.n).toBe(1);
  });

  it("only the doctor closes; closing needs a note and the right version", async () => {
    const id = await intake();
    const close = (who: string, body: object) => call(who, "POST", `/${id}/close`, body);
    expect(
      (await close("rec@example.test", { status: "done", note: "x", version: 1 })).status,
    ).toBe(403);
    expect((await close("doc@example.test", { status: "done", note: "", version: 1 })).status).toBe(
      400,
    );
    expect(
      (await close("doc@example.test", { status: "done", note: "ok", version: 7 })).status,
    ).toBe(409);
    expect(
      (await close("doc@example.test", { status: "done", note: "Given", version: 1 })).status,
    ).toBe(200);
    const done = (await (await call("doc@example.test", "GET", "?status=done")).json()) as Json;
    expect(done.data.requests).toHaveLength(1);
  });

  it("developer sees nothing; no session is refused", async () => {
    expect((await call("dev@example.test", "GET", "")).status).toBe(403);
    const res = await app.request(`${ORIGIN}/api/staff/patient-requests`, { method: "GET" }, env);
    expect(res.status).toBe(401);
  });

  it("rejects a bad intake body", async () => {
    const res = await call("rec@example.test", "POST", "", {
      patientId: "p1",
      type: "copy",
      body: "",
    });
    expect(res.status).toBe(400);
  });
});
