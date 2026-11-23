import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTPASTREC00001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009944', 'Fake Past Patient', 'male', 40, '+919900001158', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("past records (6.7.3)", () => {
  it("doctor creates a note that appears in History as Added later", async () => {
    const row = await repos(doctor).pastRecords.create(PATIENT_ID, {
      recordedOn: "2019-05-10",
      body: "Old paper chart: RCT started on 36",
    });
    expect(row.recordedOn).toBe("2019-05-10");

    const feed = await repos(doctor).history.listFeed(PATIENT_ID, { limit: 10 });
    const past = feed.entries.find((e) => e.type === "past_record");
    expect(past?.status).toBe("Added later");
    expect(past?.summary).toMatch(/Old paper chart/);

    const audit = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE table_name = 'past_records'`)
      .get() as { n: number };
    expect(audit.n).toBe(1);
  });

  it("receptionist cannot create", async () => {
    await expect(
      repos(receptionist).pastRecords.create(PATIENT_ID, {
        recordedOn: "2019-05-10",
        body: "Should fail",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("receptionist feed omits past records", async () => {
    await repos(doctor).pastRecords.create(PATIENT_ID, {
      recordedOn: "2018-01-01",
      body: "Clinical paper note",
    });
    const feed = await repos(receptionist).history.listFeed(PATIENT_ID, { limit: 20 });
    expect(feed.entries.every((e) => e.type !== "past_record")).toBe(true);
  });
});
