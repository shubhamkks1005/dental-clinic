import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

// Q1.9 (D4): the receptionist asks, the doctor answers.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTCANCELREQ01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009905', 'Fake Cancel Patient', 'female', 30, '+919900001905', 'active')`,
    )
    .run(PATIENT_ID);
});

async function issued() {
  const d = await repos(receptionist).bills.create({
    patientId: PATIENT_ID,
    billOn: "2026-11-23",
    items: [{ procedureLabel: "X", qty: 1, unitPaise: 500_00 }],
  });
  return repos(receptionist).bills.issue(d.id, d.version);
}

describe("ask the doctor to cancel a bill (Q1.9)", () => {
  it("receptionist asks once; doctor sees it; the cancel answers it", async () => {
    const bill = await issued();
    await repos(receptionist).bills.requestCancel(bill.id, "Wrong procedure billed");
    await expect(repos(receptionist).bills.requestCancel(bill.id, "again")).rejects.toBeInstanceOf(
      ConflictError,
    );
    const open = await repos(doctor).bills.listOpenCancelRequests();
    expect(open).toHaveLength(1);
    expect(open[0]?.reason).toBe("Wrong procedure billed");
    await repos(doctor).bills.cancel(bill.id, bill.version, "Wrong procedure billed");
    expect(await repos(doctor).bills.listOpenCancelRequests()).toHaveLength(0);
  });

  it("needs a reason, only works on an issued bill, and the list is doctor only", async () => {
    const bill = await issued();
    await expect(repos(receptionist).bills.requestCancel(bill.id, "  ")).rejects.toBeInstanceOf(
      InvalidError,
    );
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Y", qty: 1, unitPaise: 100_00 }],
    });
    await expect(repos(receptionist).bills.requestCancel(draft.id, "x")).rejects.toBeInstanceOf(
      InvalidError,
    );
    await expect(repos(receptionist).bills.listOpenCancelRequests()).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("the doctor can dismiss a request; the bill stays", async () => {
    const bill = await issued();
    await repos(receptionist).bills.requestCancel(bill.id, "Maybe wrong");
    const [r] = await repos(doctor).bills.listOpenCancelRequests();
    await repos(doctor).bills.dismissCancelRequest(r!.id);
    expect(await repos(doctor).bills.listOpenCancelRequests()).toHaveLength(0);
    expect((await repos(doctor).bills.get(bill.id)).status).toBe("issued");
  });
});
