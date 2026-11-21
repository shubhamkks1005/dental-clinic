import {
  ConflictError,
  createDb,
  createRepos,
  NEVER_RESETS,
  patientCodeSql,
  takeNumber,
  type Ctx,
  type Db,
} from "@clinic/db";
import { newUlid } from "@clinic/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Spike 0.6.3: the real repository code against the REAL D1 (remote binding in `wrangler dev`).
// Throwaway database only; it creates and empties its own spike_docs table.
type SpikeEnv = { DB: D1Database };

const PERIOD = "2098-99";
const docs = sqliteTable("spike_docs", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  number: integer("number").notNull(),
  code: text("code").notNull(),
  note: text("note").notNull(),
});
const ctxA: Ctx = { userId: "spike-a", role: "doctor", requestId: "spike-1" };
const ctxB: Ctx = { userId: "spike-b", role: "developer", requestId: "spike-2" };

async function num(d1: D1Database, sql: string, ...params: unknown[]): Promise<number | null> {
  const row = await d1
    .prepare(sql)
    .bind(...params)
    .first<{ v: number | null }>();
  return row?.v ?? null;
}

const receiptCounter = (d1: D1Database) =>
  num(d1, "SELECT value AS v FROM counters WHERE name = 'receipt' AND period = ?", PERIOD);

async function reset(d1: D1Database) {
  await d1.batch([
    d1.prepare(
      "CREATE TABLE IF NOT EXISTS spike_docs (id TEXT PRIMARY KEY, period TEXT NOT NULL, number INTEGER NOT NULL, code TEXT NOT NULL, note TEXT NOT NULL CHECK (note <> 'fail'), UNIQUE (period, number))",
    ),
    d1.prepare("DELETE FROM spike_docs"),
    d1.prepare("DELETE FROM counters WHERE period IN (?, ?)").bind(PERIOD, NEVER_RESETS),
  ]);
}

async function createDoc(db: Db, note: string, counter: "receipt" | "patient_code" = "receipt") {
  const period = counter === "receipt" ? PERIOD : NEVER_RESETS;
  const { bump, value } = takeNumber(db, counter, period, "spike");
  await db.batch([
    bump,
    db
      .insert(docs)
      .values({ id: newUlid(), period, number: value, code: patientCodeSql(value), note }),
  ]);
}

async function batchRollback(db: Db, d1: D1Database) {
  await reset(d1);
  await createDoc(db, "ok");
  const started = Date.now();
  const threw = await createDoc(db, "fail").then(
    () => false,
    () => true,
  );
  const counter = await receiptCounter(d1);
  return {
    pass: threw && counter === 1,
    failedBatchRejected: threw,
    counterAfterFailedBatch: counter,
    batchMs: Date.now() - started,
  };
}

// SQLite changes() inside one D1 batch: the audit row is written only if the UPDATE changed a row.
async function changesGuard(d1: D1Database) {
  const row = await d1
    .prepare("SELECT id, version FROM settings WHERE key = 'patient_code.digits'")
    .first<{ id: string; version: number }>();
  if (!row) return { pass: false, error: "settings row missing; were the migrations applied?" };
  const count = () =>
    num(d1, "SELECT count(*) AS v FROM audit_log WHERE request_id = 'spike-guard'");
  const attempt = (version: number) =>
    d1.batch([
      d1
        .prepare("UPDATE settings SET version = version WHERE id = ? AND version = ?")
        .bind(row.id, version),
      d1
        .prepare(
          "INSERT INTO audit_log (id, action, table_name, row_id, created_by, updated_by, request_id) SELECT ?, 'update', 'settings', ?, 'spike', 'spike', 'spike-guard' WHERE changes() > 0",
        )
        .bind(newUlid(), row.id),
    ]);
  const before = await count();
  await attempt(row.version + 999);
  const afterMiss = await count();
  await attempt(row.version);
  const afterHit = await count();
  const missAdded = (afterMiss ?? 0) - (before ?? 0);
  const hitAdded = (afterHit ?? 0) - (afterMiss ?? 0);
  return {
    pass: missAdded === 0 && hitAdded === 1,
    auditRowsWhenNoRowChanged: missAdded,
    auditRowsWhenRowChanged: hitAdded,
  };
}

// The real settings repository: two tabs, then two saves racing.
async function editConflict(db: Db, d1: D1Database) {
  const KEY = "patient_code.prefix";
  const count = () =>
    num(d1, "SELECT count(*) AS v FROM audit_log WHERE created_by IN ('spike-a', 'spike-b')");
  const before = (await count()) ?? 0;
  const a = createRepos(db, ctxA).settings;
  const b = createRepos(db, ctxB).settings;

  const seen = await a.get(KEY);
  await a.update(KEY, seen.value, seen.version);
  const tabConflict = await b.update(KEY, seen.value, seen.version).then(
    () => false,
    (e) => e instanceof ConflictError,
  );

  const now = await a.get(KEY);
  const race = await Promise.allSettled([
    a.update(KEY, now.value, now.version),
    b.update(KEY, now.value, now.version),
  ]);
  const raceOk =
    race.filter((r) => r.status === "fulfilled").length === 1 &&
    race.some((r) => r.status === "rejected" && r.reason instanceof ConflictError);
  const added = ((await count()) ?? 0) - before;
  return {
    pass: tabConflict && raceOk && added === 2,
    secondTabGotConflict: tabConflict,
    race: race.map((r) => r.status),
    auditRowsAdded: added,
  };
}

async function gapFree(db: Db, d1: D1Database) {
  await reset(d1);
  const started = Date.now();
  const parallel = await Promise.allSettled(Array.from({ length: 50 }, () => createDoc(db, "ok")));
  const parallelMs = Date.now() - started;
  const failedParallel = parallel.filter((r) => r.status === "rejected").length;
  const failRejected = await createDoc(db, "fail").then(
    () => false,
    () => true,
  );
  await createDoc(db, "ok");
  const rows = await d1
    .prepare("SELECT number FROM spike_docs WHERE period = ? ORDER BY number")
    .bind(PERIOD)
    .all<{ number: number }>();
  const numbers = rows.results.map((r) => r.number);
  const gaps = Array.from({ length: 51 }, (_, i) => i + 1).filter((n) => !numbers.includes(n));
  const counter = await receiptCounter(d1);
  const pass =
    failedParallel === 0 &&
    failRejected &&
    numbers.length === 51 &&
    gaps.length === 0 &&
    counter === 51;
  return {
    pass,
    parallelRequests: 50,
    failedParallel,
    failedInsertRejected: failRejected,
    rows: numbers.length,
    first: numbers[0],
    last: numbers.at(-1),
    gaps,
    counter,
    parallelMs,
  };
}

async function patientCode(db: Db, d1: D1Database) {
  await createDoc(db, "ok", "patient_code");
  const row = await d1
    .prepare("SELECT code FROM spike_docs WHERE period = ?")
    .bind(NEVER_RESETS)
    .first<{ code: string }>();
  return { pass: row?.code === "P-000001", code: row?.code ?? null };
}

export default {
  async fetch(_request: Request, env: SpikeEnv): Promise<Response> {
    const db = createDb(env.DB);
    const report = {
      batchRollback: await batchRollback(db, env.DB),
      changesGuard: await changesGuard(env.DB),
      editConflict: await editConflict(db, env.DB),
      gapFree: await gapFree(db, env.DB),
      patientCode: await patientCode(db, env.DB),
    };
    return Response.json(report);
  },
};
