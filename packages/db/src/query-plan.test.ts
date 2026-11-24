import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "./context";
import { authRepo } from "./repos/auth";
import { computeMonthStatRows } from "./repos/daily-stats-queries";
import { createRepos } from "./repos/index";
import { rebuildPatientSearchStatements } from "./search/patient-tokens";
import { KNOWN_SCANS, type KnownScan } from "./testing/known-scans";
import { fullScans, queryPlan, recordingDb, scansIn } from "./testing";
import { firstPage } from "@clinic/shared";

// 1.2.8: every statement the repositories run reaches growing tables through an index.
// New tables are "big" by default (testing/query-plan.ts), so the patient search in Phase 2
// falls under this guard as soon as its repository has a line below.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "req-1" };

let t: ReturnType<typeof recordingDb>;
const addUser = (id: string, role: string) =>
  t.sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, ?, ?, 's', 's')",
    )
    .run(id, `${id}@example.test`, `Test ${id}`, role);

beforeEach(() => {
  t = recordingDb();
  addUser("doc-a", "doctor");
  addUser("rec-1", "receptionist");
});

describe("query-plan guard (1.2.8)", () => {
  it("catches a query that reads a whole growing table", () => {
    const plan = queryPlan(t.sqlite, "SELECT id FROM audit_log WHERE request_id = ?", ["r"]);
    expect(fullScans(plan)).toEqual(["SCAN audit_log"]);
    expect(fullScans(queryPlan(t.sqlite, "SELECT id FROM users WHERE name = ?", ["x"]))).toEqual(
      [],
    );
  });

  it("sign-in and session statements use indexes", async () => {
    const auth = authRepo(t.db);
    const user = await auth.findStaffByEmail("doc-a@example.test");
    if (!user) throw new Error("seed user missing");
    const sessionId = await auth.completeLogin({
      user,
      bindSub: "sub-a",
      tokenHash: "hash-1",
      expiresAt: "2099-01-01T00:00:00.000Z",
      userAgent: null,
      requestId: "req-1",
    });
    await auth.findSession("hash-1");
    await auth.touchSession(sessionId);
    await auth.logout(sessionId, { userId: "doc-a", requestId: "req-2" });
    await auth.recordLoginProblem("login_denied", "unknown n***@example.test", "req-3");
    await auth.branding();
    expect(t.ran.length).toBeGreaterThan(5);
    expect(scansIn(t.sqlite, t.ran)).toEqual([]);
  });

  it("staff and settings statements use indexes", async () => {
    const repos = createRepos(t.db, doctor);
    const auth = authRepo(t.db);
    const rec = await auth.findStaffByEmail("rec-1@example.test");
    if (!rec) throw new Error("seed user missing");
    await auth.completeLogin({
      user: rec,
      bindSub: null,
      tokenHash: "hash-r",
      expiresAt: "2099-01-01T00:00:00.000Z",
      userAgent: null,
      requestId: "req-r",
    });
    t.ran.length = 0;

    await repos.staff.list();
    const id = await repos.staff.add({
      name: "New",
      email: "new@example.test",
      role: "receptionist",
    });
    await repos.staff.changeRole(id, "doctor", 1);
    await repos.staff.deactivate("rec-1", 1);
    await repos.staff.reactivate("rec-1", 2);
    await repos.staff.resetGoogleLink("rec-1", "rec-new@example.test", 3);
    const setting = await repos.settings.get("patient_code.prefix");
    await repos.settings.update("patient_code.prefix", "P-", setting.version);
    await repos.settings.list();
    await repos.lists.add("referral_sources", { label: "A", data: {} });
    const [b] = await repos.lists
      .add("referral_sources", { label: "B", data: {} })
      .then((l) => l.slice(1));
    if (!b) throw new Error("no item");
    await repos.lists.move("referral_sources", b.id, "up", b.version);
    await repos.lists.update("referral_sources", b.id, { label: "B2", data: {} }, b.version + 1);
    expect(t.ran.length).toBeGreaterThan(10);
    expect(scansIn(t.sqlite, t.ran)).toEqual([]);
  });

  // S2.2.3: the growing-table queries of the busy screens. A scan that is known and waits for an
  // index in S5.1 is named in KNOWN_SCANS (it shows in the test report and does not fail the test).
  // Any other scan fails. When S5.1 adds the index its entry must go (its test fails until then).
  describe("hot screens (S2.2.3)", () => {
    const NOW = new Date("2026-11-23T06:30:00.000Z");
    const rec: Ctx = { userId: "rec-1", role: "receptionist", requestId: "req-h" };
    const PATIENT = "01M85PATIENTPLANTEST001";

    async function runHotQueries(): Promise<(typeof t)["ran"]> {
      t.sqlite
        .prepare(
          `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
           VALUES (?, 'system', 'system', 'P-009901', 'Fake Plan Patient', 'female', 30, '+919900009901', 'active')`,
        )
        .run(PATIENT);
      await t.db.batch(
        rebuildPatientSearchStatements(
          t.db,
          PATIENT,
          {
            fullName: "Fake Plan Patient",
            code: "P-009901",
            mobile: "+919900009901",
            mobileSecondary: null,
            legacyRef: null,
          },
          "system",
        ) as never,
      );
      const doc = createRepos(t.db, doctor);
      const front = createRepos(t.db, rec);
      t.ran.length = 0;

      // Dashboard: day grain (this month, with compare) and month grain (12 months).
      await doc.dashboard.get({ range: "this_month", compare: "1" }, NOW);
      await doc.dashboard.get({ range: "12m" }, NOW);
      await computeMonthStatRows(t.db, "2026-11");
      // Dues, draft lists.
      await front.bills.listDues(NOW);
      await front.bills.duesForPatients([PATIENT]);
      await doc.visits.listDrafts();
      await doc.prescriptions.listDrafts();
      // Patients list: plain, search, both quick filters, balance-due ids, and its extras.
      const list = front.patients.list;
      await list(firstPage(), { now: NOW });
      await list({ ...firstPage(), q: "fake" }, { now: NOW });
      await list(firstPage(), { filter: "new_month", now: NOW });
      await list(firstPage(), { filter: "inactive_6m", now: NOW });
      await list(firstPage(), { status: "all", onlyIds: [PATIENT], now: NOW });
      await front.patients.visitAndNext([PATIENT], NOW);
      // Appointments: one day, and a week.
      await front.appointments.listForDay("2026-11-23");
      await front.appointments.listForRange("2026-11-23", "2026-11-29");
      return t.ran;
    }

    it("reads the busy screens through indexes, except the known scans", async () => {
      const ran = await runHotQueries();
      expect(ran.length).toBeGreaterThan(20);
      const found = uniqueScans(scansIn(t.sqlite, ran));
      expect(found.filter((line) => !isKnownScan(line))).toEqual([]);
    });

    // One test per known scan, so the list shows in the test report. When S5.1 adds the index the
    // test for that entry fails: delete the entry then.
    it.each(KNOWN_SCANS.map((k) => [k.name, k] as const))("%s", async (_name, known) => {
      const found = uniqueScans(scansIn(t.sqlite, await runHotQueries()));
      expect(found.some((line) => matches(known, line))).toBe(true);
    });
  });
});

// Same scan from the same statement shows once; white space is collapsed so snippets are short.
const uniqueScans = (lines: string[]) => [...new Set(lines.map((l) => l.replace(/\s+/g, " ")))];
const matches = (k: KnownScan, line: string) =>
  line.startsWith(`${k.scan} `) && line.includes(" <- ") && line.includes(k.sqlHas);
const isKnownScan = (line: string) => KNOWN_SCANS.some((k) => matches(k, line));

// T1.2: the new Part T indexes are what the day list, the break check and the approvals list use.
describe("query-plan guard: Part T tables", () => {
  it("the day list is read by date through an index, in queue order, with no full scan", () => {
    const plan = queryPlan(
      t.sqlite,
      `SELECT id FROM appointments WHERE date_local = ? AND deleted_at IS NULL ORDER BY queue_order`,
      ["2026-11-25"],
    );
    expect(fullScans(plan)).toEqual([]);
    expect(plan.join(" ")).toMatch(/appointments_day_(queue|status)_idx|appointments_chair_day/);
  });

  it("the queue move reads one whole day by its date index, with no full scan", () => {
    const plan = queryPlan(
      t.sqlite,
      `SELECT id FROM appointments WHERE date_local = (SELECT date_local FROM appointments WHERE id = ?) AND deleted_at IS NULL`,
      ["a1"],
    );
    expect(fullScans(plan)).toEqual([]);
  });

  it("the open break of a day uses its partial unique index", () => {
    const plan = queryPlan(
      t.sqlite,
      `SELECT id FROM doctor_breaks WHERE date_local = ? AND ended_at IS NULL AND deleted_at IS NULL`,
      ["2026-11-25"],
    );
    expect(fullScans(plan)).toEqual([]);
    expect(plan.join(" ")).toMatch(/doctor_breaks_(one_open_uidx|day_idx)/);
  });

  it("the open approvals list uses the status index", () => {
    const plan = queryPlan(
      t.sqlite,
      `SELECT id FROM approval_requests WHERE status = 'open' AND deleted_at IS NULL ORDER BY urgent DESC, created_at LIMIT 50`,
      [],
    );
    expect(fullScans(plan)).toEqual([]);
    expect(plan.join(" ")).toContain("approval_requests_status_idx");
  });
});
