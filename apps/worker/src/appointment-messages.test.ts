import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

// Q1.5: moving or cancelling a booking makes its queued messages out of date and queues ONE new
// message for the new time (or the cancel). A child's message goes to the guardian.

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
const VISIT_ID = "01M83VTYPE01CONSULT000001";

function futureDay(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  const ins = sqlite.prepare(
    `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, no_mobile_reason, guardian_name, guardian_mobile, status)
     VALUES (?, 'system', 'system', ?, ?, 'female', ?, ?, ?, ?, ?, 'active')`,
  );
  ins.run("p1", "P-000001", "Meena Fake", 30, "+919000000001", null, null, null);
  ins.run(
    "kid",
    "P-000002",
    "Kiddo Fake",
    6,
    null,
    "Child, uses parent phone",
    "Sunita Devi",
    "+919000000002",
  );
  for (const p of ["p1", "kid"]) {
    sqlite
      .prepare(
        `INSERT INTO consents (id, created_by, updated_by, patient_id, type, notice_version, given, given_at, recorded_by, method)
         VALUES (?, 'system', 'system', ?, 'sms_reminders', 1, 1, '2026-11-01T00:00:00Z', 'system', 'verbal')`,
      )
      .run(`c-${p}`, p);
  }
});

async function post(path: string, body: unknown) {
  const init = sameOriginPost(await sessionCookie(env, "rec@example.test"));
  return app.request(
    `${ORIGIN}/api/staff${path}`,
    {
      ...init,
      method: "POST",
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );
}

async function book(patientId: string, startMin: number) {
  const res = await post("/appointments", {
    patientId,
    visitTypeId: VISIT_ID,
    doctorId: "doc-a",
    dateLocal: futureDay(3),
    startMin,
    source: "phone",
    overrideReason: "test: any day",
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { data: { appointment: { id: string; version: number } } }).data
    .appointment;
}

function queueOld(appointmentId: string, patientId: string) {
  const row = sqlite.prepare(
    `INSERT INTO message_outbox (id, created_by, updated_by, patient_id, appointment_id, kind, channel, template_key,
       params_json, body, segments, status, dedupe_key, send_after, expire_at)
     VALUES (?, 'system', 'system', ?, ?, ?, 'whatsapp_manual', ?, '{}', 'old text', 1, 'needs_human', ?, '2026-11-20T00:00:00Z', '2030-01-01T00:00:00Z')`,
  );
  row.run(
    `m-c-${appointmentId}`,
    patientId,
    appointmentId,
    "confirm",
    "confirm",
    `confirm:${appointmentId}`,
  );
  row.run(
    `m-r-${appointmentId}`,
    patientId,
    appointmentId,
    "remind",
    "remind",
    `remind:${appointmentId}`,
  );
}

describe("messages follow a moved or cancelled booking (Q1.5)", () => {
  it("move: old messages are out of date, one 'moved' message for the new time", async () => {
    const a = await book("p1", 600);
    queueOld(a.id, "p1");
    const res = await post(`/appointments/${a.id}/reschedule`, {
      version: a.version,
      dateLocal: futureDay(3),
      startMin: 690,
      overrideReason: "test: any day",
    });
    expect(res.status).toBe(201);
    const old = sqlite
      .prepare("SELECT status, skip_reason FROM message_outbox WHERE appointment_id = ?")
      .all(a.id);
    expect(old).toEqual([
      { status: "cancelled", skip_reason: "out_of_date" },
      { status: "cancelled", skip_reason: "out_of_date" },
    ]);
    const moved = sqlite
      .prepare("SELECT kind, body, status FROM message_outbox WHERE kind = 'reschedule'")
      .all() as { kind: string; body: string; status: string }[];
    expect(moved).toHaveLength(1);
    expect(moved[0]!.body).toContain("Dear Meena");
    expect(moved[0]!.body).toContain("11:30 am");
    expect(moved[0]!.status).toBe("needs_human");
  });

  it("cancel for a child: the message goes to the guardian and speaks for the child", async () => {
    const a = await book("kid", 600);
    queueOld(a.id, "kid");
    const res = await post(`/appointments/${a.id}/cancel`, {
      version: a.version,
      reason: "patient_request",
    });
    expect(res.status).toBe(200);
    const cancelled = sqlite
      .prepare("SELECT body FROM message_outbox WHERE kind = 'cancel'")
      .all() as { body: string }[];
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0]!.body).toContain("Dear Sunita");
    expect(cancelled[0]!.body).toContain("Kiddo's appointment");
    expect(
      sqlite
        .prepare("SELECT COUNT(*) AS n FROM message_outbox WHERE skip_reason = 'out_of_date'")
        .get(),
    ).toEqual({ n: 2 });
  });
});
