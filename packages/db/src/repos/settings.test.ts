import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "user-doctor", role: "doctor", requestId: "req-1" };
const developer: Ctx = { userId: "user-dev", role: "developer", requestId: "req-3" };
const receptionist: Ctx = { userId: "user-rec", role: "receptionist", requestId: "req-2" };
const KEY = "patient_code.prefix";

let t: ReturnType<typeof testDb>;
const rows = (sqlText: string) => t.sqlite.prepare(sqlText).all();
const repo = (ctx: Ctx) => createRepos(t.db, ctx).settings;
const stored = () => rows(`SELECT value_json, version FROM settings WHERE key = '${KEY}'`)[0];

beforeEach(() => {
  t = testDb();
});

describe("settings repository (1.2.6)", () => {
  it("reads a setting as its JSON value with its version", async () => {
    expect(await repo(receptionist).get(KEY)).toEqual({ value: "P-", version: 1 });
  });

  it("a doctor's update changes the value, bumps the version and writes exactly one audit row", async () => {
    expect(await repo(doctor).update(KEY, "PT-", 1)).toEqual({ value: "PT-", version: 2 });
    expect(stored()).toEqual({ value_json: '"PT-"', version: 2 });
    const audit = rows(
      "SELECT action, table_name, before_json, after_json, created_by FROM audit_log",
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "update",
      table_name: "settings",
      created_by: "user-doctor",
    });
    expect(JSON.parse(String(audit[0]?.before_json))).toMatchObject({ value: "P-", version: 1 });
    expect(JSON.parse(String(audit[0]?.after_json))).toMatchObject({ value: "PT-", version: 2 });
  });

  it("a receptionist cannot change settings, and nothing is written", async () => {
    await expect(repo(receptionist).update(KEY, "X-", 1)).rejects.toBeInstanceOf(ForbiddenError);
    expect(stored()).toEqual({ value_json: '"P-"', version: 1 });
    expect(rows("SELECT * FROM audit_log")).toHaveLength(0);
  });

  it("an unknown key is a plain not-found error", async () => {
    await expect(repo(doctor).get("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(repo(doctor).update("nope", 1, 1)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("settings store rules (1.5.1)", () => {
  it("an invalid value is not saved: no change, no new version, no audit row", async () => {
    await expect(repo(doctor).update(KEY, "p-", 1)).rejects.toBeInstanceOf(InvalidError);
    await expect(repo(doctor).update("patient_code.digits", 99, 1)).rejects.toThrow(
      "Use at most 8 digits.",
    );
    await expect(repo(doctor).update("patient_code.digits", "6", 1)).rejects.toThrow(
      "Enter a number.",
    );
    expect(stored()).toEqual({ value_json: '"P-"', version: 1 });
    expect(rows("SELECT * FROM audit_log")).toHaveLength(0);
  });

  it("saves the cleaned value (trimmed text)", async () => {
    expect(await repo(doctor).update("clinic.name", "  Sample Clinic ", 1)).toEqual({
      value: "Sample Clinic",
      version: 2,
    });
    expect(rows("SELECT value_json FROM settings WHERE key = 'clinic.name'")[0]).toEqual({
      value_json: '"Sample Clinic"',
    });
  });

  it("lists the known settings in a fixed order with their versions", async () => {
    const list = await repo(receptionist).list();
    expect(list.map((s) => [s.key, s.value, s.version])).toEqual([
      ["patient_code.prefix", "P-", 1],
      ["patient_code.digits", 6, 1],
      ["clinic.name", "Align Dentistry", 1],
      ["clinic.logo", null, 1],
      ["clinic.timings", expect.objectContaining({ slotMinutes: 15, chairs: 1 }), 1],
      ["clinic.holidays", [], 1],
      ["privacy_notice.version", 1, 1],
      ["privacy_notice.body", expect.stringContaining("PLACEHOLDER privacy notice"), 1],
      ["appointments.book_ahead_days", 90, 1],
      ["medical_history.stale_months", 6, 1],
      ["chart.view", { facing: "dentist", notation: "fdi" }, 1],
      ["consent.templates", expect.objectContaining({ extraction: expect.any(Object) }), 1],
      ["clinic.address", "Sample address — set in Settings", 1],
      ["clinic.phone", "0000000000", 1],
      ["clinic.tagline", "Family dental care", 1],
      ["doctor.name", "Dr Sample", 1],
      ["doctor.qualifications", "BDS", 1],
      ["doctor.speciality", "Dental surgeon", 1],
      ["doctor.registration_no", "", 1],
      ["medicines.list_reviewed", null, 1],
      ["billing.shadow_series", true, 1],
    ]);
  });
});

describe("two tabs editing the same setting (1.2.7)", () => {
  it("the second save with an old version gets a conflict and changes nothing", async () => {
    const tabA = await repo(doctor).get(KEY);
    const tabB = await repo(developer).get(KEY);
    await repo(doctor).update(KEY, "A-", tabA.version);
    await expect(repo(developer).update(KEY, "B-", tabB.version)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(stored()).toEqual({ value_json: '"A-"', version: 2 });
    expect(rows("SELECT * FROM audit_log")).toHaveLength(1);
  });

  it("two saves racing at the same moment: one wins, one conflicts, one audit row", async () => {
    const results = await Promise.allSettled([
      repo(doctor).update(KEY, "A-", 1),
      repo(developer).update(KEY, "B-", 1),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    const lost = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(lost.reason).toBeInstanceOf(ConflictError);
    expect(stored()?.version).toBe(2);
    expect(rows("SELECT * FROM audit_log")).toHaveLength(1);
  });

  it("the conflict message is a plain sentence that says to reload", () => {
    expect(new ConflictError().message).toMatch(/Reload/);
  });
});
