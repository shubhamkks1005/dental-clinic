import { is } from "drizzle-orm";
import {
  check,
  getTableConfig,
  integer,
  SQLiteSyncDialect,
  SQLiteTable,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { oneOf, STANDARD_COLUMNS, standardColumns } from "./columns";
import * as schema from "./index";

type Table = Parameters<typeof getTableConfig>[0];

const dialect = new SQLiteSyncDialect();

function ruleProblems(table: Table): string[] {
  const { name, columns, checks } = getTableConfig(table);
  const problems: string[] = [];
  const byName = new Map(columns.map((c) => [c.name, c]));

  for (const col of STANDARD_COLUMNS) {
    if (!byName.has(col)) problems.push(`${name}: missing ${col}`);
  }
  if (byName.get("id")?.primary !== true) problems.push(`${name}: id is not the primary key`);
  if (byName.get("deleted_at")?.notNull) problems.push(`${name}: deleted_at must allow NULL`);

  for (const c of columns) {
    const isText = c.columnType === "SQLiteText";
    const isInteger = c.columnType === "SQLiteInteger";
    if (c.name.endsWith("_paise") && !isInteger)
      problems.push(`${name}.${c.name}: money must be integer paise`);
    if (c.name.endsWith("_at") && !isText)
      problems.push(`${name}.${c.name}: times must be UTC ISO text`);
    if (c.name.endsWith("_on") && !isText)
      problems.push(`${name}.${c.name}: dates must be YYYY-MM-DD text`);
    const enumValues = (c as { enumValues?: string[] }).enumValues ?? [];
    const hasCheck = checks.some((k) => dialect.sqlToQuery(k.value).sql.includes(`"${c.name}"`));
    if (enumValues.length > 0 && !hasCheck) problems.push(`${name}.${c.name}: enum needs a CHECK`);
  }
  return problems;
}

describe("table rules (1.2.1)", () => {
  const tables = Object.values(schema as Record<string, unknown>).filter((v): v is Table =>
    is(v, SQLiteTable),
  );

  it("covers the base tables", () => {
    expect(tables.map((t) => getTableConfig(t).name).sort()).toEqual([
      "access_log",
      "alerts",
      "appointments",
      "audit_log",
      "bill_items",
      "bills",
      "certificates",
      "consents",
      "counters",
      "files",
      "list_items",
      "medical_history",
      "patient_search",
      "patients",
      "payment_allocations",
      "payments",
      "plan_item_versions",
      "plan_items",
      "prescription_items",
      "prescriptions",
      "print_log",
      "refunds",
      "settings",
      "staff_sessions",
      "tooth_events",
      "users",
      "visit_addenda",
      "visit_diagnoses",
      "visit_procedures",
      "visits",
    ]);
  });

  it("every schema table follows the rules", () => {
    expect(tables.flatMap(ruleProblems)).toEqual([]);
  });

  it("a table built with the helpers passes", () => {
    const good = sqliteTable(
      "good",
      { ...standardColumns(), kind: text("kind", { enum: ["a", "b"] }).notNull() },
      (t) => [check("good_kind", oneOf(t.kind.name, ["a", "b"]))],
    );
    expect(ruleProblems(good)).toEqual([]);
  });

  it("catches missing columns, float money and enums without CHECK", () => {
    const bad = sqliteTable("bad", {
      id: text("id").primaryKey(),
      amount_paise: text("amount_paise"),
      kind: text("kind", { enum: ["a", "b"] }),
      seen_at: integer("seen_at"),
    });
    const problems = ruleProblems(bad);
    expect(problems).toContain("bad: missing created_by");
    expect(problems).toContain("bad.amount_paise: money must be integer paise");
    expect(problems).toContain("bad.kind: enum needs a CHECK");
    expect(problems).toContain("bad.seen_at: times must be UTC ISO text");
  });

  it("oneOf refuses values that could break the SQL", () => {
    expect(() => oneOf("kind", ["ok", "it's"])).toThrow();
  });
});
