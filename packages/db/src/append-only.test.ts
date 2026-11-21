import { describe, expect, it } from "vitest";
import { sourceFiles, type SourceFile } from "./testing";

// audit_log and access_log are append-only (1.2.5). No triggers are allowed yet (spike 3.2.6),
// so this test is the guard: app code must never update or delete them.
const DRIZZLE_WRITE = /\.(update|delete)\(\s*(auditLog|accessLog)\b/;
const RAW_SQL_WRITE = /\b(UPDATE|DELETE\s+FROM)\s+[`"']?(audit_log|access_log)\b/i;

const offenders = (files: SourceFile[]) =>
  files.filter((f) => DRIZZLE_WRITE.test(f.text) || RAW_SQL_WRITE.test(f.text)).map((f) => f.path);

const APP_SOURCE = ["apps/worker/src", "apps/web/src", "packages/db/src", "packages/shared/src"];

describe("append-only logs (1.2.5)", () => {
  it("no app code updates or deletes audit_log or access_log", () => {
    const files = APP_SOURCE.flatMap(sourceFiles);
    expect(files.map((f) => f.path)).toContain("packages/db/src/audit.ts");
    expect(offenders(files)).toEqual([]);
  });

  it("the guard catches both Drizzle and raw SQL writes", () => {
    const bad = [
      { path: "a.ts", text: "db.update(auditLog).set({})" },
      { path: "b.ts", text: "db.delete( accessLog ).where(x)" },
      { path: "c.ts", text: 'db.run(sql`DELETE FROM "audit_log" WHERE 1`)' },
      { path: "d.ts", text: "update access_log set x = 1" },
      { path: "ok.ts", text: "db.insert(auditLog).values({})" },
    ];
    expect(offenders(bad)).toEqual(["a.ts", "b.ts", "c.ts", "d.ts"]);
  });
});
