import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
let doctor: string;
let receptionist: string;

beforeEach(async () => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc-a@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec-1@example.test", role: "receptionist" });
  doctor = await sessionCookie(env, "doc-a@example.test");
  receptionist = await sessionCookie(env, "rec-1@example.test");
});

describe("dashboard API (6.3.1)", () => {
  it("returns prepared arrays with private max-age=60 for the doctor", async () => {
    const res = await app.request(
      `${ORIGIN}/api/staff/dashboard?range=7d`,
      { headers: { cookie: doctor } },
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, max-age=60");
    const body = (await res.json()) as {
      ok: boolean;
      data: { totals: { arrived: number }; series: unknown[]; rowsRead: number };
    };
    expect(body.ok).toBe(true);
    expect(body.data.series).toBeDefined();
    expect(body.data.totals).toBeDefined();
    expect(body.data.rowsRead).toBeLessThan(2000);
  });

  it("refuses the receptionist (full dashboard is reports.full)", async () => {
    const res = await app.request(
      `${ORIGIN}/api/staff/dashboard?range=today`,
      { headers: { cookie: receptionist } },
      env,
    );
    expect(res.status).toBe(403);
  });

  it("rejects a bad custom range with a plain sentence", async () => {
    const res = await app.request(
      `${ORIGIN}/api/staff/dashboard?range=custom&from=nope&to=2026-11-01`,
      { headers: { cookie: doctor } },
      env,
    );
    expect(res.status).toBe(400);
  });
});
