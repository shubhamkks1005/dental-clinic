import { describe, expect, it } from "vitest";
import { testDb } from "../testing";
import { createRepos } from "../repos";
import type { Ctx } from "../context";
import { buildFakeClinicalSeedSql } from "./fake-clinical-sql";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

describe("fake clinical seed (3.10.5)", () => {
  it("builds SQL for 200 fake patients and chart stays under 400 rows", async () => {
    const sqlBatches = buildFakeClinicalSeedSql(200, 2);
    expect(sqlBatches.length).toBeGreaterThan(2);

    const t = testDb();
    for (const batch of sqlBatches) {
      t.sqlite.exec(batch);
    }

    const nPatients = (
      t.sqlite.prepare(`SELECT COUNT(*) AS n FROM patients WHERE id LIKE 'seedc%'`).get() as {
        n: number;
      }
    ).n;
    expect(nPatients).toBe(200);

    const repos = createRepos(t.db, doctor);
    const chart = await repos.toothEvents.chartForPatient("seedc00000");
    expect(chart.rowsRead).toBeLessThan(400);
  });
});
