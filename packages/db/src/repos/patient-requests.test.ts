import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const reception: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const count = (q: string) => (t.sqlite.prepare(q).get() as { n: number }).n;

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Request One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

async function made(body = "Fake request") {
  return repos(reception).patientRequests.create({ patientId: "p1", type: "copy", body });
}

describe("patient requests (8.2.11)", () => {
  it("creates an open request with a 30 day due date, closes it once, audits both", async () => {
    const { id, dueOn } = await made();
    expect(dueOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await repos().patientRequests.list("open")).toHaveLength(1);
    const close = (note: string, version: number) =>
      repos().patientRequests.close(id, { status: "done", note, version });
    await expect(close(" ", 1)).rejects.toBeInstanceOf(InvalidError);
    await expect(close("ok", 9)).rejects.toBeInstanceOf(ConflictError);
    await close("Given", 1);
    expect(await repos().patientRequests.list("open")).toHaveLength(0);
    expect(await repos().patientRequests.list("done")).toHaveLength(1);
    await expect(close("again", 2)).rejects.toBeInstanceOf(InvalidError);
    expect(count("SELECT COUNT(*) n FROM audit_log WHERE table_name = 'patient_requests'")).toBe(2);
  });

  it("refuses a request for a patient that does not exist", async () => {
    await expect(
      repos().patientRequests.create({ patientId: "nope", type: "copy", body: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("receptionist sees the list without note text and cannot open or close", async () => {
    const { id } = await made("Fake note that mentions a fake tooth problem");
    const rows = await repos(reception).patientRequests.list("all");
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain("tooth");
    await expect(repos(reception).patientRequests.get(id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      repos(reception).patientRequests.close(id, { status: "done", note: "x", version: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("the doctor's view of one request is written to the access log", async () => {
    const { id } = await made("Fake note");
    const row = await repos().patientRequests.get(id);
    expect(row.body).toBe("Fake note");
    expect(count("SELECT COUNT(*) n FROM access_log WHERE resource = 'patient_request'")).toBe(1);
  });
});

describe("error log scrub (9.2.5)", () => {
  it("scrubs error messages that look like personal data", async () => {
    await repos().errorLog.insert({
      source: "browser",
      kind: "TypeError",
      message: "patient Asha mobile 9999999999",
      path: "/today",
    });
    await repos().errorLog.insert({ source: "server", kind: "Boom", message: "db timeout" });
    const rows = t.sqlite.prepare("SELECT message FROM error_log ORDER BY message").all() as {
      message: string;
    }[];
    expect(rows.map((r) => r.message)).toEqual([
      "Redacted error (possible personal data).",
      "db timeout",
    ]);
  });
});
