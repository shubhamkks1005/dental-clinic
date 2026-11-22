/// <reference types="@cloudflare/vitest-plugin/types" />
import { createDb, type StaffUser } from "@clinic/db";
import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { openSession } from "../domain/login";

// 1.7.2: API + D1 inside the Workers runtime (real schema via applyD1Migrations).
const fetchWorker = (path: string, init?: RequestInit) =>
  exports.default.fetch(new Request(`http://localhost:8787${path}`, init));

async function seedDoctorSession(): Promise<string> {
  const db = createDb(env.DB);
  const id = "01WORKERINTDOC000000000000";
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, role, status, google_sub, created_by, updated_by)
     VALUES (?, 'doctor@example.test', 'Dev Doctor', 'doctor', 'active', NULL, 'system', 'system')
     ON CONFLICT(email) DO NOTHING`,
  )
    .bind(id)
    .run();
  const row = await env.DB.prepare(
    `SELECT id, email, name, role, status, google_sub AS googleSub
     FROM users WHERE email = 'doctor@example.test'`,
  ).first<StaffUser>();
  if (!row) throw new Error("seed doctor missing");
  return openSession(db, row, null, { userAgent: "workers-int", requestId: "wint" }, Date.now());
}

describe("Workers runtime + D1 (1.7.2)", () => {
  it("health pings D1 and returns ok", async () => {
    const res = await fetchWorker("/api/staff/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      data: { status: "ok" },
    });
  });

  it("settings list runs on the migrated schema for a signed-in doctor", async () => {
    const token = await seedDoctorSession();
    const res = await fetchWorker("/api/staff/settings", {
      headers: { cookie: `__Host-staff_session=${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: true;
      data: { settings: { key: string }[] };
    };
    expect(body.ok).toBe(true);
    expect(body.data.settings.map((s) => s.key)).toEqual(
      expect.arrayContaining(["clinic.name", "patient_code.prefix", "clinic.timings"]),
    );
  });

  it("settings list is 401 without a session", async () => {
    expect((await fetchWorker("/api/staff/settings")).status).toBe(401);
  });
});
