import { newUlid } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO daily_stats (id, created_by, updated_by, date_local, metric, dim, value)
       VALUES (?, 'system', 'system', '2026-10-15', 'arrived_patients', '', 4)`,
    )
    .run(newUlid());
});

describe("stats export CSV (6.4.2)", () => {
  it("exports daily_stats rows without patient names", async () => {
    const out = await createRepos(t.db, doctor).statsExport.csv({
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(out.csv.startsWith("date_local,metric,dim,value\n")).toBe(true);
    expect(out.csv).toContain("2026-10-15,arrived_patients,,4");
    expect(out.csv.toLowerCase()).not.toContain("fake");
    expect(out.rows).toBe(1);
  });
});
