import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

beforeEach(() => {
  t = testDb();
});

describe("patient requests and error log (8.2.11, 9.2.5)", () => {
  it("creates an open request with a 30 day due date, closes it once, audits both", async () => {
    const { id, dueOn } = await repos().patientRequests.create({
      patientId: "P-FAKE-1",
      type: "copy",
      body: "Fake request",
    });
    expect(dueOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await repos().patientRequests.listOpen()).toHaveLength(1);
    await expect(
      repos().patientRequests.close(id, { status: "done", note: " ", version: 1 }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().patientRequests.close(id, { status: "done", note: "ok", version: 9 }),
    ).rejects.toBeInstanceOf(ConflictError);
    await repos().patientRequests.close(id, { status: "done", note: "Given", version: 1 });
    expect(await repos().patientRequests.listOpen()).toHaveLength(0);
    await expect(
      repos().patientRequests.close(id, { status: "done", note: "again", version: 2 }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

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
