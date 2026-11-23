import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
});

async function call(email: string, method: "GET" | "POST", body?: unknown, raw?: string) {
  const cookie = await sessionCookie(env, email);
  if (method === "GET") {
    return app.request(`${ORIGIN}/api/staff/errors`, { method, headers: { cookie } }, env);
  }
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}/api/staff/errors`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: raw ?? JSON.stringify(body),
    },
    env,
  );
}

const report = { kind: "TypeError", message: "x is not a function", path: "/app/today" };

describe("error log routes (9.2.5)", () => {
  it("needs a session", async () => {
    const res = await app.request(`${ORIGIN}/api/staff/errors`, { method: "GET" }, env);
    expect(res.status).toBe(401);
  });

  it("receptionist can report but cannot read the list; doctor reads it", async () => {
    expect((await call("rec@example.test", "POST", report)).status).toBe(201);
    expect((await call("rec@example.test", "GET")).status).toBe(403);
    const res = await call("doc@example.test", "GET");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { errors: Array<Record<string, string>> } };
    expect(body.data.errors[0]).toMatchObject({ kind: "TypeError", role: "receptionist" });
  });

  it("rejects a bad body and an oversized body", async () => {
    expect((await call("rec@example.test", "POST", { kind: "x y", message: "m" })).status).toBe(
      400,
    );
    const big = JSON.stringify({ ...report, message: "a".repeat(5000) });
    expect((await call("rec@example.test", "POST", undefined, big)).status).toBe(413);
  });

  it("rate limits a noisy browser", async () => {
    for (let i = 0; i < 5; i++) await call("rec@example.test", "POST", report);
    expect((await call("rec@example.test", "POST", report)).status).toBe(429);
  });

  it("stored rows hold no patient data", async () => {
    await call("rec@example.test", "POST", {
      ...report,
      message: "Fake Visit One 9000000001 failed",
      path: "/app/patients/01JABCDEFGHJKMNPQRSTVWXYZ0",
    });
    const row = sqlite.prepare("SELECT message, path FROM error_log").get() as {
      message: string;
      path: string;
    };
    expect(row.message).not.toMatch(/9000000001/);
    expect(row.path).toBe("/app/patients/:id");
  });
});
