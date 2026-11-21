import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { accessInsert, auditInsert } from "./audit";
import type { Db } from "./client";
import type { Ctx } from "./context";
import { settings } from "./schema";
import { testDb } from "./testing";

const ctx: Ctx = { userId: "user-doctor", role: "doctor", requestId: "req-1" };

let db: Db;
let rows: (sqlText: string) => Record<string, unknown>[];

beforeEach(() => {
  const t = testDb();
  db = t.db;
  rows = (sqlText) => t.sqlite.prepare(sqlText).all();
});

const prefixRow = async () =>
  (await db.select().from(settings).where(eq(settings.key, "patient_code.prefix")))[0]!;

describe("audit log (1.2.5)", () => {
  it("one change in a batch writes exactly one audit row with who, what, before and after", async () => {
    const before = await prefixRow();
    await db.batch([
      db
        .update(settings)
        .set({ valueJson: '"PT-"', version: sql`${settings.version} + 1`, updatedBy: ctx.userId })
        .where(eq(settings.id, before.id)),
      auditInsert(db, ctx, {
        action: "update",
        table: "settings",
        rowId: before.id,
        before: { valueJson: before.valueJson },
        after: { valueJson: '"PT-"' },
      }),
    ]);

    const audit = rows("SELECT * FROM audit_log");
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "update",
      table_name: "settings",
      row_id: before.id,
      before_json: JSON.stringify({ valueJson: '"P-"' }),
      after_json: JSON.stringify({ valueJson: '"PT-"' }),
      created_by: "user-doctor",
      request_id: "req-1",
    });
  });

  it("if the change fails, the audit row is rolled back with it", async () => {
    const before = await prefixRow();
    await expect(
      db.batch([
        auditInsert(db, ctx, { action: "update", table: "settings", rowId: before.id }),
        db.update(settings).set({ valueJson: "not json" }).where(eq(settings.id, before.id)),
      ]),
    ).rejects.toThrow();
    expect(rows("SELECT * FROM audit_log")).toHaveLength(0);
  });

  it("records a view in access_log", async () => {
    await accessInsert(db, ctx, { action: "view", resource: "patients", resourceId: "p1" });
    expect(rows("SELECT action, resource, resource_id, created_by FROM access_log")).toEqual([
      { action: "view", resource: "patients", resource_id: "p1", created_by: "user-doctor" },
    ]);
  });
});
