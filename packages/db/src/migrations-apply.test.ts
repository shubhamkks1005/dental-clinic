import { isSettingKey, parseSettingValue, SETTING_KEYS } from "@clinic/shared";
import { afterAll, describe, expect, it } from "vitest";
import { STANDARD_COLUMNS } from "./schema/columns";
import { migratedSqlite } from "./testing";

// D1 is SQLite, so Node's built-in SQLite is a faithful check of the migration SQL.
const db = migratedSqlite();
afterAll(() => db.close());

const tableNames = () =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r) => r.name);

const columnNames = (table: string) =>
  db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((r) => r.name);

const insertUser = (email: string, role: string) =>
  db
    .prepare(
      "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, 'Test User', ?, 'system', 'system')",
    )
    .run(`id-${email}`, email, role);

describe("migrations on an empty database (1.2.3)", () => {
  it("create exactly the base tables", () => {
    expect(tableNames()).toEqual([
      "access_log",
      "alerts",
      "appointments",
      "audit_log",
      "bill_items",
      "bills",
      "certificates",
      "consents",
      "counters",
      "daily_stats",
      "day_closes",
      "dues_calls",
      "files",
      "list_items",
      "medical_history",
      "monthly_stats",
      "outreach_contacts",
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

  it("give every table the standard columns", () => {
    for (const table of tableNames()) {
      expect(columnNames(String(table))).toEqual(expect.arrayContaining([...STANDARD_COLUMNS]));
    }
  });

  it("seed the default settings", () => {
    const rows = db.prepare("SELECT key, value_json FROM settings ORDER BY key").all();
    expect(rows.map((r) => r.key)).toEqual([
      "appointments.book_ahead_days",
      "appointments.no_show_after_minutes",
      "appointments.status_undo_hours",
      "billing.gst_mode",
      "billing.shadow_series",
      "chart.view",
      "clinic.address",
      "clinic.holidays",
      "clinic.logo",
      "clinic.name",
      "clinic.phone",
      "clinic.tagline",
      "clinic.timings",
      "consent.templates",
      "doctor.name",
      "doctor.qualifications",
      "doctor.registration_no",
      "doctor.speciality",
      "files.storage_crit_gb",
      "files.storage_warn_gb",
      "medical_history.stale_months",
      "medicines.list_reviewed",
      "outreach.incomplete_days",
      "outreach.recall_max_months",
      "outreach.recall_min_months",
      "patient_code.digits",
      "patient_code.prefix",
      "privacy_notice.body",
      "privacy_notice.version",
      "records.demand_hours",
      "ui.auto_refresh_seconds",
    ]);
  });

  it("every seeded setting is a known key whose value passes its own rule (1.5.1)", () => {
    const rows = db.prepare("SELECT key, value_json FROM settings").all();
    for (const { key, value_json } of rows) {
      const name = String(key);
      expect(isSettingKey(name), name).toBe(true);
      if (isSettingKey(name)) {
        expect(parseSettingValue(name, JSON.parse(String(value_json))).ok, name).toBe(true);
      }
    }
    expect(rows).toHaveLength(SETTING_KEYS.length);
  });

  it("fill created_at as UTC ISO text", () => {
    const row = db.prepare("SELECT created_at FROM settings LIMIT 1").get();
    expect(row?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("accept a valid staff user and reject a bad role or uppercase email", () => {
    expect(() => insertUser("doctor@example.com", "doctor")).not.toThrow();
    expect(() => insertUser("admin@example.com", "admin")).toThrow(/CHECK/);
    expect(() => insertUser("Upper@example.com", "receptionist")).toThrow(/CHECK/);
  });

  it("reject invalid settings JSON, bad counter periods and negative counters", () => {
    expect(() =>
      db.exec(
        "INSERT INTO settings (id, key, value_json, created_by, updated_by) VALUES ('s1', 'x', 'not json', 'system', 'system')",
      ),
    ).toThrow(/CHECK/);
    const counter = (id: string, period: string, value: number) =>
      db
        .prepare(
          "INSERT INTO counters (id, name, period, value, created_by, updated_by) VALUES (?, 'receipt', ?, ?, 'system', 'system')",
        )
        .run(id, period, value);
    expect(() => counter("c1", "2026-27", 0)).not.toThrow();
    expect(() => counter("c2", "2026", 0)).toThrow(/CHECK/);
    expect(() => counter("c3", "2027-28", -1)).toThrow(/CHECK/);
    expect(() => counter("c4", "2026-27", 5)).toThrow(/UNIQUE/);
  });
});
