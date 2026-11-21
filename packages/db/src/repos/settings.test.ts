import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "user-doctor", role: "doctor", requestId: "req-1" };
const receptionist: Ctx = { userId: "user-rec", role: "receptionist", requestId: "req-2" };

let t: ReturnType<typeof testDb>;
const rows = (sqlText: string) => t.sqlite.prepare(sqlText).all();

beforeEach(() => {
  t = testDb();
});

describe("settings repository (1.2.6)", () => {
  it("reads a setting as its JSON value", async () => {
    expect(await createRepos(t.db, receptionist).settings.get("patient_code.prefix")).toBe("P-");
  });

  it("a doctor's update changes the value, bumps the version and writes exactly one audit row", async () => {
    await createRepos(t.db, doctor).settings.update("patient_code.prefix", "PT-");

    expect(
      rows(
        "SELECT value_json, version, updated_by FROM settings WHERE key = 'patient_code.prefix'",
      ),
    ).toEqual([{ value_json: '"PT-"', version: 2, updated_by: "user-doctor" }]);
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
    await expect(
      createRepos(t.db, receptionist).settings.update("patient_code.prefix", "X-"),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(rows("SELECT value_json FROM settings WHERE key = 'patient_code.prefix'")).toEqual([
      { value_json: '"P-"' },
    ]);
    expect(rows("SELECT * FROM audit_log")).toHaveLength(0);
  });

  it("an unknown key is a plain not-found error", async () => {
    await expect(createRepos(t.db, doctor).settings.get("nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
