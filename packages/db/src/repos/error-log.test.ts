import { describe, expect, it } from "vitest";
import { testDb } from "../testing";
import { createRepos } from "./index";

function setup() {
  const { db, sqlite } = testDb();
  const as = (role: "doctor" | "receptionist", userId: string) =>
    createRepos(db, { userId, role, requestId: "x" });
  return { sqlite, as };
}
const base = { source: "browser" as const, kind: "TypeError" };

describe("error log (9.2.5)", () => {
  it("stores role, scrubs digits, emails and record ids", async () => {
    const { sqlite, as } = setup();
    await as("receptionist", "r1").errorLog.report({
      ...base,
      message: "Failed for a@b.com id 9876543210",
      path: "/app/patients/01JABCDEFGHJKMNPQRSTVWXYZ0?tab=x",
      appVersion: "v1",
    });
    const row = sqlite.prepare("SELECT * FROM error_log").get() as Record<string, string>;
    expect(row.role).toBe("receptionist");
    expect(row.app_version).toBe("v1");
    expect(row.path).toBe("/app/patients/:id");
    expect(row.message).toBe("Failed for [removed] id #");
  });

  it("redacts a message that mentions personal fields", async () => {
    const { sqlite, as } = setup();
    await as("doctor", "d1").errorLog.report({ ...base, message: "bad patient value" });
    const row = sqlite.prepare("SELECT message FROM error_log").get() as { message: string };
    expect(row.message).toBe("Redacted error (possible personal data).");
  });

  it("only the doctor reads the list, newest first", async () => {
    const { sqlite, as } = setup();
    const rec = as("receptionist", "r1");
    await rec.errorLog.report({ ...base, kind: "First", message: "one" });
    sqlite.prepare("UPDATE error_log SET created_at = '2020-01-01T00:00:00.000Z'").run();
    await rec.errorLog.report({ ...base, kind: "Second", message: "two" });
    await expect(rec.errorLog.list()).rejects.toThrow();
    const rows = await as("doctor", "d1").errorLog.list();
    expect(rows.map((r) => r.kind)).toEqual(["Second", "First"]);
  });

  it("limits reports per user per minute", async () => {
    const { as } = setup();
    const rec = as("receptionist", "r1");
    for (let i = 0; i < 5; i++)
      expect(await rec.errorLog.report({ ...base, message: "m" })).toBe("stored");
    expect(await rec.errorLog.report({ ...base, message: "m" })).toBe("limited");
    expect(await as("receptionist", "r2").errorLog.report({ ...base, message: "m" })).toBe(
      "stored",
    );
  });

  it("limits reports per user per day", async () => {
    const { sqlite, as } = setup();
    const old = new Date(Date.now() - 2 * 3600_000).toISOString();
    const ins = sqlite.prepare(
      `INSERT INTO error_log (id, created_at, created_by, updated_by, source, kind, message)
       VALUES (?, ?, 'r1', 'r1', 'browser', 'E', 'm')`,
    );
    for (let i = 0; i < 100; i++) ins.run(`id${i}`, old);
    expect(await as("receptionist", "r1").errorLog.report({ ...base, message: "m" })).toBe(
      "limited",
    );
  });
});
