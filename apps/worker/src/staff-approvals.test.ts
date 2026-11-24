import { beforeEach, describe, expect, it } from "vitest";
import { addStaff, makeEnv } from "./testing/app-env";
import { staffCall } from "./testing/staff-call";

// Part T: the desk asks the doctor; the doctor answers; discount Reject.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
const call = (email: string, method: "GET" | "POST", path: string, body?: unknown) =>
  staffCall(env, email, method, path, body);
const DOC = "doc@example.test";
const REC = "rec@example.test";
const DEV = "dev@example.test";
const count = (table: string) =>
  Number(sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n);

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: DOC });
  addStaff(sqlite, { id: "rec-1", email: REC, role: "receptionist" });
  addStaff(sqlite, { id: "dev-1", email: DEV, role: "developer" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES ('a1', 's', 's', 'p1', '1', 'vt1', 'Consultation', '2026-11-25T05:00:00.000Z', '2026-11-25', 630, 660, 'scheduled', 'phone', 'normal', 0)`,
    )
    .run();
});

const ask = { type: "emergency_insert", appointmentId: "a1", note: "Pain, 3 PM", urgent: true };

describe("approvals over HTTP", () => {
  it("the desk asks, the doctor sees it first in the list and answers Yes; the desk sees the answer", async () => {
    const created = await call(REC, "POST", "/approvals", ask);
    expect(created.status).toBe(201);
    const id = created.json.data.id as string;

    const docList = await call(DOC, "GET", "/approvals");
    expect(docList.json.data.approvals[0]).toMatchObject({
      id,
      patientName: "Fake One",
      urgent: true,
    });

    const answered = await call(DOC, "POST", `/approvals/${id}/answer`, {
      decision: "approve",
      note: "Yes",
      version: 1,
    });
    expect(answered.status).toBe(200);
    const mine = await call(REC, "GET", "/approvals");
    expect(mine.json.data.approvals[0]).toMatchObject({
      status: "approved",
      answerNote: "Yes",
    });
    expect((await call(DOC, "GET", "/approvals")).json.data.approvals).toEqual([]);
  });

  it("asking twice is 409; a bad body is 400; the doctor cannot ask; the developer sees nothing", async () => {
    expect((await call(REC, "POST", "/approvals", ask)).status).toBe(201);
    expect((await call(REC, "POST", "/approvals", ask)).status).toBe(409);
    expect((await call(REC, "POST", "/approvals", { type: "refund" })).status).toBe(400);
    expect((await call(DOC, "POST", "/approvals", ask)).status).toBe(403);
    expect((await call(DEV, "POST", "/approvals", ask)).status).toBe(403);
    expect((await call(DEV, "GET", "/approvals")).status).toBe(403);
  });

  it("the desk cannot answer or dismiss; a closed request cannot be answered again", async () => {
    const id = (await call(REC, "POST", "/approvals", ask)).json.data.id as string;
    expect(
      (await call(REC, "POST", `/approvals/${id}/answer`, { decision: "approve", version: 1 }))
        .status,
    ).toBe(403);
    expect((await call(REC, "POST", `/approvals/${id}/dismiss`, { version: 1 })).status).toBe(403);
    expect((await call(DOC, "POST", `/approvals/${id}/dismiss`, { version: 1 })).status).toBe(200);
    const again = await call(DOC, "POST", `/approvals/${id}/answer`, {
      decision: "reject",
      version: 2,
    });
    expect(again.status).toBe(409);
    expect(again.json.error.message).toBe("This request is already closed.");
  });

  it("the desk can withdraw; the answer never changes a bill, payment, message or appointment", async () => {
    const before = ["bills", "payments", "message_outbox"].map(count);
    const apptBefore = JSON.stringify(sqlite.prepare("SELECT * FROM appointments").all());
    const id = (await call(REC, "POST", "/approvals", ask)).json.data.id as string;
    await call(DOC, "POST", `/approvals/${id}/answer`, { decision: "approve", version: 1 });
    expect(["bills", "payments", "message_outbox"].map(count)).toEqual(before);
    expect(JSON.stringify(sqlite.prepare("SELECT * FROM appointments").all())).toBe(apptBefore);
    const id2 = (await call(REC, "POST", "/approvals", { ...ask, type: "overbook" })).json.data
      .id as string;
    expect((await call(REC, "POST", `/approvals/${id2}/withdraw`, {})).status).toBe(200);
    expect((await call(DOC, "GET", "/approvals")).json.data.approvals).toEqual([]);
  });
});

describe("discount reject over HTTP", () => {
  async function pendingBill() {
    const created = await call(REC, "POST", "/bills", {
      patientId: "p1",
      billOn: "2026-11-25",
      items: [{ procedureLabel: "Fake cleaning", qty: 1, unitPaise: 20000 }],
    });
    const bill = created.json.data.bill;
    const withDiscount = await call(REC, "POST", `/bills/${bill.id}/discount`, {
      version: bill.version,
      discountPaise: 5000,
      reason: "hardship",
    });
    return withDiscount.json.data.bill;
  }

  it("the doctor rejects; the total stays; the desk gets the reason marker; the list empties", async () => {
    const bill = await pendingBill();
    const res = await call(DOC, "POST", `/bills/${bill.id}/discount/reject`, {
      version: bill.version,
    });
    expect(res.status).toBe(200);
    expect(res.json.data.bill).toMatchObject({ discountPaise: 0, discountReason: "rejected" });
    expect(res.json.data.bill.totalPaise).toBe(bill.totalPaise);
    expect((await call(DOC, "GET", "/bills/pending-discounts")).json.data.pending).toEqual([]);
  });

  it("the desk and the developer cannot reject; a body without a version is 400", async () => {
    const bill = await pendingBill();
    expect(
      (await call(REC, "POST", `/bills/${bill.id}/discount/reject`, { version: bill.version }))
        .status,
    ).toBe(403);
    expect(
      (await call(DEV, "POST", `/bills/${bill.id}/discount/reject`, { version: bill.version }))
        .status,
    ).toBe(403);
    expect((await call(DOC, "POST", `/bills/${bill.id}/discount/reject`, {})).status).toBe(400);
  });
});
