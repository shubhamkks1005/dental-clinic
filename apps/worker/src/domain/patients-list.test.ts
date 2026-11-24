import { createDb, createRepos, timeD1, type D1Binding } from "@clinic/db";
import { FakeD1, migratedSqlite } from "@clinic/db/testing";
import { describe, expect, it } from "vitest";
import { listPatients } from "./patients";

// S3.4.1: last visit, next appointment and dues are asked together, so a page of patients costs
// the same few round trips whether it holds 5 patients or 50.
const staff = { userId: "rec-1", role: "receptionist" as const, requestId: "r1" };
const fakeId = (n: number) => `01M85PATLISTTRIPS${String(n).padStart(6, "0")}`;

function setup(count: number) {
  const sqlite = migratedSqlite();
  const insert = sqlite.prepare(
    `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
     VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
  );
  for (let n = 1; n <= count; n++) {
    insert.run(
      fakeId(n),
      `P-${String(800000 + n)}`,
      `Fake List ${n}`,
      `+9199000${String(n).padStart(5, "0")}`,
    );
  }
  const plain = createDb(new FakeD1(sqlite) as unknown as D1Binding);
  const waves = { count: 0, inFlight: 0 };
  const { d1, timer } = timeD1(waveCounter(new FakeD1(sqlite), waves) as unknown as D1Binding);
  return { plain, timed: createDb(d1), timer, waves };
}

type Stmt = Record<string, (...a: unknown[]) => Promise<unknown>> & {
  bind(...v: unknown[]): Stmt;
};

// A "wave" starts when a query begins while none is running: queries sent together are one wave,
// so waves = how many times the Worker waits for the database one after another.
function waveCounter(inner: FakeD1, waves: { count: number; inFlight: number }) {
  const wrap = (stmt: Stmt): Stmt =>
    new Proxy(stmt, {
      get(target, prop) {
        if (prop === "bind") return (...v: unknown[]) => wrap(target.bind(...v));
        if (["all", "run", "raw", "first"].includes(String(prop))) {
          return async (...a: unknown[]) => {
            if (waves.inFlight++ === 0) waves.count++;
            try {
              return await target[prop as string]!(...a);
            } finally {
              waves.inFlight--;
            }
          };
        }
        const v = Reflect.get(target, prop, target);
        return typeof v === "function" ? v.bind(target) : v;
      },
    });
  return {
    prepare: (sql: string) => wrap(inner.prepare(sql) as unknown as Stmt),
    batch: (list: unknown[]) => inner.batch(list as never),
  };
}

async function seedDue(t: ReturnType<typeof setup>, patientId: string, paise: number) {
  const repos = createRepos(t.plain, staff);
  const draft = await repos.bills.create({
    patientId,
    billOn: "2026-11-20",
    items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: paise }],
  });
  await repos.bills.issue(draft.id, draft.version);
}

const params = (pageSize: number) =>
  new URLSearchParams({ pageSize: String(pageSize), sort: "code" });

describe("listPatients round trips (S3.4.1)", () => {
  it("keeps the same reply: dues and last visit land on the right rows", async () => {
    const t = setup(3);
    await seedDue(t, fakeId(2), 120_00);
    await createRepos(t.plain, { ...staff, role: "doctor" }).visits.open({
      patientId: fakeId(1),
      visitDateLocal: "2026-11-10",
    });
    const page = await listPatients(createRepos(t.timed, staff), params(25));
    expect(page.rows.map((r) => r.duePaise)).toEqual([0, 120_00, 0]);
    expect(page.rows.map((r) => r.lastVisitOn)).toEqual(["2026-11-10", null, null]);
  });

  it("a page of 50 (two chunks of 40) needs no more round trips than a page of 5", async () => {
    const small = setup(5);
    await seedDue(small, fakeId(1), 50_00);
    await listPatients(createRepos(small.timed, staff), params(5));

    const big = setup(50);
    await seedDue(big, fakeId(1), 50_00);
    await listPatients(createRepos(big.timed, staff), params(50));

    console.log(
      `queries/waves: 5 patients = ${small.timer.queries}/${small.waves.count}, 50 patients = ${big.timer.queries}/${big.waves.count}`,
    );
    expect(big.waves.count).toBe(small.waves.count);
    // count + rows, then last visit / next appointment / dues together, then paid amounts.
    expect(big.waves.count).toBeLessThanOrEqual(4);
  });
});
