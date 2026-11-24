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

// A Tuesday 7 to 13 days ahead: always open, always in the future, inside the 90-day limit.
function nextTuesday(): string {
  const d = new Date(Date.now() + 7 * 86_400_000);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

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

describe("POST /api/staff/appointments (2.3.4 + 2.3.5)", () => {
  it("receptionist books; second overlap is 409 with one audit row", async () => {
    const body = {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      dateLocal: nextTuesday(),
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
          dateLocal: nextTuesday(),
          startMin: 600,
          source: "phone",
        })
      ).status,
    ).toBe(403);
    expect((await book("rec@example.test", { patientId: "p1" })).status).toBe(400);
  });

  it("closed day without override is 400; with reason is 201 and overbook", async () => {
    const closed = await book("rec@example.test", {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      dateLocal: "2026-11-22",
      startMin: 600,
      source: "phone",
    });
    expect(closed.status).toBe(400);
    const forced = await book("rec@example.test", {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      dateLocal: "2026-11-22",
      startMin: 600,
      source: "phone",
      overrideReason: "Doctor asked for Sunday slot",
    });
    expect(forced.status).toBe(201);
    expect(sqlite.prepare("SELECT overbook FROM appointments").get()).toEqual({ overbook: 1 });
  });

  it("PATCH status follows the wheel; illegal jump is 409", async () => {
    const created = await book("rec@example.test", {
      patientId: "p1",
      visitTypeId: VISIT_ID,
      dateLocal: nextTuesday(),
      startMin: 600,
      source: "phone",
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      data: { appointment: { id: string; version: number } };
    };
    const appointment = createdBody.data.appointment;
    const cookie = await sessionCookie(env, "rec@example.test");
    const init = sameOriginPost(cookie);
    const ok = await app.request(
      `${ORIGIN}/api/staff/appointments/${appointment.id}/status`,
      {
        ...init,
        method: "PATCH",
        headers: {
          ...(init.headers as Record<string, string>),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "confirmed", version: appointment.version }),
      },
      env,
    );
    expect(ok.status).toBe(200);
    const bad = await app.request(
      `${ORIGIN}/api/staff/appointments/${appointment.id}/status`,
      {
        ...init,
        method: "PATCH",
        headers: {
          ...(init.headers as Record<string, string>),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "completed", version: appointment.version + 1 }),
      },
      env,
    );
    expect(bad.status).toBe(409);
  });
});

describe("GET /api/staff/appointments/slots", () => {
  async function slots(query: string) {
    const cookie = await sessionCookie(env, "rec@example.test");
    return app.request(
      `${ORIGIN}/api/staff/appointments/slots?visitTypeId=${VISIT_ID}&${query}`,
      { headers: { cookie } },
      env,
    );
  }

  it("suggests five by default, across days", async () => {
    const res = await slots("date=2030-01-07");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { slots: unknown[] } };
    expect(body.data.slots).toHaveLength(5);
  });

  it("day=1 lists every free time of that one day, so the desk can pick any", async () => {
    const res = await slots("date=2030-01-07&day=1");
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: { slots: { dateLocal: string; startMin: number }[] };
    };
    expect(data.slots.length).toBeGreaterThan(5);
    expect(data.slots.every((s) => s.dateLocal === "2030-01-07")).toBe(true);
  });
});
