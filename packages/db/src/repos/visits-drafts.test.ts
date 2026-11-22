import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const P1 = "01M83PATIENTDRAFTTEST001";
const P2 = "01M83PATIENTDRAFTTEST002";

beforeEach(() => {
  t = testDb();
  for (const [id, code, name] of [
    [P1, "P-009801", "Fake Draft Patient A"],
    [P2, "P-009802", "Fake Draft Patient B"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, ?, 'female', 30, '+919900001111', 'active')`,
      )
      .run(id, code, name);
  }
});

describe("visits drafts list (3.5.8)", () => {
  it("lists drafts from any day so yesterday still shows next morning", async () => {
    await repos().visits.open({ patientId: P1, visitDateLocal: "2026-11-21" });
    await repos().visits.open({ patientId: P2, visitDateLocal: "2026-11-22" });
    const drafts = await repos().visits.listDrafts();
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({
      patientId: P1,
      patientCode: "P-009801",
      patientName: "Fake Draft Patient A",
      visitDateLocal: "2026-11-21",
    });
    expect(drafts[1]?.visitDateLocal).toBe("2026-11-22");
  });

  it("omits finalised visits", async () => {
    const draft = await repos().visits.open({ patientId: P1, visitDateLocal: "2026-11-21" });
    await repos().visits.finalise(draft.id, { version: draft.version });
    await repos().visits.open({ patientId: P2, visitDateLocal: "2026-11-21" });
    const drafts = await repos().visits.listDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.patientId).toBe(P2);
  });

  it("refuses receptionist", async () => {
    await expect(repos(receptionist).visits.listDrafts()).rejects.toBeInstanceOf(ForbiddenError);
  });
});
