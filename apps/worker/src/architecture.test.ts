import { sourceFiles, type SourceFile } from "@clinic/db/testing";
import { describe, expect, it } from "vitest";

// Route files only validate, call one domain function and reply. They never touch the
// database: no Drizzle, no @clinic/db, no env.DB (1.2.6, AGENTS.md "Code structure").
const ROUTE_TOUCHES_DB = /from\s+["'](drizzle-orm[^"']*|@clinic\/db[^"']*)["']|\benv\.DB\b/;
// Domain functions get repositories passed in; they never build SQL themselves.
const DOMAIN_TOUCHES_SQL = /from\s+["']drizzle-orm[^"']*["']|\benv\.DB\b/;

const files = sourceFiles("apps/worker/src");
const routes = files.filter((f) => f.path.includes("/routes/"));
const domain = files.filter((f) => f.path.includes("/domain/"));
const offenders = (list: SourceFile[], rule: RegExp) =>
  list.filter((f) => rule.test(f.text)).map((f) => f.path);

describe("worker architecture (1.2.6)", () => {
  it("finds the route files", () => {
    expect(routes.map((f) => f.path).sort()).toEqual([
      "apps/worker/src/routes/hooks.ts",
      "apps/worker/src/routes/portal.ts",
      "apps/worker/src/routes/staff-auth.ts",
      "apps/worker/src/routes/staff.ts",
    ]);
  });

  it("no route file touches the database", () => {
    expect(offenders(routes, ROUTE_TOUCHES_DB)).toEqual([]);
  });

  it("no domain file builds SQL", () => {
    expect(offenders(domain, DOMAIN_TOUCHES_SQL)).toEqual([]);
  });

  it("the guard catches the ways a route could reach the database", () => {
    const bad = [
      { path: "a", text: 'import { eq } from "drizzle-orm";' },
      { path: "b", text: "import { createDb } from '@clinic/db';" },
      { path: "c", text: "const db = createDb(c.env.DB);" },
      { path: "ok", text: 'import { Hono } from "hono";' },
    ];
    expect(offenders(bad, ROUTE_TOUCHES_DB)).toEqual(["a", "b", "c"]);
  });
});
