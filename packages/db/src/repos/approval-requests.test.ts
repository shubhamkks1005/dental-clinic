import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const desk: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const desk2: Ctx = { userId: "rec-2", role: "receptionist", requestId: "r4" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };
const NOW = new Date("2026-11-25T05:00:00.000Z");

let t: ReturnType<typeof testDb>;
const approvals = (ctx: Ctx = desk) => createRepos(t.db, ctx).approvals;
const count = (sql: string) => Number(t.sqlite.prepare(sql).get()?.n);
const clinic = () => ({
  bills: t.sqlite.prepare("SELECT * FROM bills ORDER BY id").all(),
  payments: t.sqlite.prepare("SELECT * FROM payments ORDER BY id").all(),
  appointments: t.sqlite.prepare("SELECT * FROM appointments ORDER BY id").all(),
  outbox: t.sqlite.prepare("SELECT * FROM message_outbox ORDER BY id").all(),
});

function appt(id: string) {
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES (?, 's', 's', 'p1', '1', 'vt1', 'Consultation', '2026-11-25T05:00:00.000Z', '2026-11-25', 630, 660, 'scheduled', 'phone', 'normal', 0)`,
    )
    .run(id);
}

beforeEach(() => {
  t = testDb();
  for (const [id, role, name] of [
    ["doc-a", "doctor", "Dr Fake"],
    ["rec-1", "receptionist", "Priya Fake"],
    ["rec-2", "receptionist", "Second Fake"],
    ["dev-1", "developer", "Dev Fake"],
  ]) {
    t.sqlite
      .prepare(
        "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, ?, ?, 's', 's')",
      )
      .run(id, `${id}@example.test`, name, role);
  }
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-000001', 'Imran Fake', 'male', 30, '+919000000001', 'active')`,
    )
    .run();
  appt("a1");
  appt("a2");
});

const ask = (appointmentId = "a1", extra: object = {}) =>
  approvals().createApproval({
    type: "emergency_insert",
    appointmentId,
    note: "Pain, wants 3 PM",
    urgent: false,
    ...extra,
  });

describe("create", () => {
  it("the desk asks; the patient comes from the appointment; an audit row is written", async () => {
    const { id } = await ask("a1", { detail: "3:00 PM" });
    const [item] = await approvals(doctor).listOpenApprovals();
    expect(item).toMatchObject({
      id,
      patientName: "Imran Fake",
      patientCode: "P-000001",
      requestedByName: "Priya Fake",
      type: "emergency_insert",
      detail: "3:00 PM",
      status: "open",
    });
    expect(
      count("SELECT count(*) AS n FROM audit_log WHERE table_name = 'approval_requests'"),
    ).toBe(1);
  });

  it("asking again for the same thing is 409; another type or appointment is fine", async () => {
    await ask("a1");
    await expect(ask("a1")).rejects.toThrow(
      "A request for this is already waiting for the doctor.",
    );
    await expect(ask("a2")).resolves.toBeTruthy();
    await expect(ask("a1", { type: "overbook" })).resolves.toBeTruthy();
  });

  it("the doctor and the developer cannot create; a missing appointment is 404", async () => {
    const input = { type: "refund" as const, appointmentId: "a1", note: "x", urgent: false };
    await expect(approvals(doctor).createApproval(input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approvals(developer).createApproval(input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(ask("nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("the lists", () => {
  it("the doctor sees urgent first, then oldest first, at most 50", async () => {
    const a = await ask("a1");
    const b = await ask("a2");
    t.sqlite
      .prepare("UPDATE approval_requests SET created_at = '2026-11-25T04:00:00.000Z' WHERE id = ?")
      .run(a.id);
    t.sqlite
      .prepare(
        "UPDATE approval_requests SET urgent = 1, created_at = '2026-11-25T04:30:00.000Z' WHERE id = ?",
      )
      .run(b.id);
    const c = await approvals().createApproval({
      type: "refund",
      patientId: "p1",
      note: "later",
      urgent: false,
    });
    t.sqlite
      .prepare("UPDATE approval_requests SET created_at = '2026-11-25T05:00:00.000Z' WHERE id = ?")
      .run(c.id);
    expect((await approvals(doctor).listOpenApprovals()).map((i) => i.id)).toEqual([
      b.id,
      a.id,
      c.id,
    ]);
    for (let i = 0; i < 55; i++) {
      t.sqlite
        .prepare(
          "INSERT INTO approval_requests (id, created_by, updated_by, type, status, patient_id, note) VALUES (?, 's', 's', 'refund', 'open', 'p1', 'bulk')",
        )
        .run(`bulk-${i}`);
    }
    expect((await approvals(doctor).listOpenApprovals()).length).toBe(50);
  });

  it("the desk sees only its own requests; each list is for one role", async () => {
    await ask("a1");
    await approvals(desk2).createApproval({
      type: "refund",
      patientId: "p1",
      note: "other",
      urgent: false,
    });
    expect((await approvals(desk).listMyApprovals()).length).toBe(1);
    await expect(approvals(doctor).listMyApprovals()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approvals(desk).listOpenApprovals()).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("answer, dismiss, withdraw", () => {
  it("the doctor approves with a note; the desk sees it; nothing else changes", async () => {
    const { id } = await ask("a1");
    const before = clinic();
    const out = await approvals(doctor).answerApproval(id, "approve", "Yes, 3 PM is fine", 1, NOW);
    expect(out).toMatchObject({ status: "approved", version: 2 });
    const [mine] = await approvals(desk).listMyApprovals();
    expect(mine).toMatchObject({ status: "approved", answerNote: "Yes, 3 PM is fine" });
    expect(mine?.answeredAt).toBe(NOW.toISOString());
    expect(clinic()).toEqual(before);
    expect(await approvals(doctor).listOpenApprovals()).toEqual([]);
  });

  it("reject and dismiss close it too", async () => {
    const a = await ask("a1");
    const b = await ask("a2");
    const rejected = await approvals(doctor).answerApproval(a.id, "reject", undefined, 1, NOW);
    expect(rejected.status).toBe("rejected");
    expect((await approvals(doctor).dismissApproval(b.id, 1, NOW)).status).toBe("dismissed");
  });

  it("the desk and the developer cannot answer or dismiss", async () => {
    const { id } = await ask("a1");
    await expect(
      approvals(desk).answerApproval(id, "approve", undefined, 1, NOW),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approvals(developer).dismissApproval(id, 1, NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("a closed request cannot be answered again; a stale version is 409", async () => {
    const { id } = await ask("a1");
    await expect(
      approvals(doctor).answerApproval(id, "approve", undefined, 7, NOW),
    ).rejects.toBeInstanceOf(ConflictError);
    await approvals(doctor).answerApproval(id, "approve", undefined, 1, NOW);
    await expect(approvals(doctor).answerApproval(id, "reject", undefined, 2, NOW)).rejects.toThrow(
      "This request is already closed.",
    );
    await expect(approvals(doctor).dismissApproval(id, 2, NOW)).rejects.toThrow("already closed");
  });

  it("after one is closed the same ask can be made again", async () => {
    const { id } = await ask("a1");
    await approvals(doctor).dismissApproval(id, 1, NOW);
    await expect(ask("a1")).resolves.toBeTruthy();
  });

  it("the desk can withdraw its own open request, not another's and not a closed one", async () => {
    const { id } = await ask("a1");
    await expect(approvals(desk2).withdrawApproval(id, NOW)).rejects.toBeInstanceOf(NotFoundError);
    await approvals(desk).withdrawApproval(id, NOW);
    expect(await approvals(doctor).listOpenApprovals()).toEqual([]);
    const again = await ask("a1");
    await approvals(doctor).answerApproval(again.id, "approve", undefined, 1, NOW);
    await expect(approvals(desk).withdrawApproval(again.id, NOW)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
