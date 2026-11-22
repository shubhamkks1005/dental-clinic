import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { patients, users } from "../schema";
import { testDb } from "../testing";
import { consentsRepo } from "./consents";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };

beforeEach(async () => {
  sqlite.exec("DELETE FROM consents; DELETE FROM patients; DELETE FROM users;");
  await db.insert(users).values({
    id: "doc-1",
    email: "doc@example.test",
    name: "Dev Doctor",
    role: "doctor",
    createdBy: "system",
    updatedBy: "system",
  });
  await db.insert(patients).values({
    id: "p1",
    code: "P-000001",
    fullName: "Fake Patient",
    gender: "female",
    ageYearsAtReg: 30,
    mobile: "+919000000001",
    createdBy: "system",
    updatedBy: "system",
  });
});

describe("consentsRepo (2.1.9)", () => {
  it("records consent and lists when / who / notice version / method", async () => {
    const repo = consentsRepo(db, doctor);
    await repo.record("p1", {
      type: "privacy_notice",
      noticeVersion: 1,
      given: true,
      method: "form",
      givenAt: "2026-11-22T10:00:00.000Z",
    });
    await repo.record("p1", {
      type: "sms_reminders",
      noticeVersion: 1,
      given: true,
      method: "form",
      givenAt: "2026-11-22T10:01:00.000Z",
    });
    // Withdraw SMS: new row, not an update.
    await repo.record("p1", {
      type: "sms_reminders",
      noticeVersion: 1,
      given: false,
      method: "form",
      givenAt: "2026-11-22T12:00:00.000Z",
    });
    const rows = await repo.listForPatient("p1");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      type: "sms_reminders",
      given: false,
      noticeVersion: 1,
      recordedByName: "Dev Doctor",
      method: "form",
    });
    expect(rows.filter((r) => r.type === "sms_reminders")).toHaveLength(2);
  });
});
