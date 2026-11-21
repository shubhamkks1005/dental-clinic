import { newUlid } from "@clinic/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { NEVER_RESETS, patientCodeSql, takeNumber } from "./numbering";
import { testDb } from "./testing";

// A throwaway document table, standing in for patients, receipts or bills.
const docs = sqliteTable("test_docs", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  number: integer("number").notNull(),
  code: text("code").notNull(),
  note: text("note").notNull(),
});

let db: Db;
let counterValue: (name: string, period: string) => unknown;

beforeEach(() => {
  const t = testDb();
  db = t.db;
  t.sqlite.exec(
    "CREATE TABLE test_docs (id TEXT PRIMARY KEY, period TEXT NOT NULL, number INTEGER NOT NULL, code TEXT NOT NULL, note TEXT NOT NULL CHECK (note <> 'fail'), UNIQUE (period, number))",
  );
  counterValue = (name, period) =>
    t.sqlite.prepare("SELECT value FROM counters WHERE name = ? AND period = ?").get(name, period)
      ?.value;
});

async function createDoc(note: string, period = "2026-27") {
  const { bump, value } = takeNumber(db, "receipt", period, "system");
  await db.batch([
    bump,
    db
      .insert(docs)
      .values({ id: newUlid(), period, number: value, code: patientCodeSql(value), note }),
  ]);
}

const numbers = async () =>
  (await db.select({ n: docs.number }).from(docs)).map((r) => r.n).sort((a, b) => a - b);

describe("gap-free numbering (1.2.4)", () => {
  it("50 parallel requests get exactly 1..50, no repeats, no gaps", async () => {
    await Promise.all(Array.from({ length: 50 }, () => createDoc("ok")));
    expect(await numbers()).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(counterValue("receipt", "2026-27")).toBe(50);
  });

  it("a failed insert rolls the counter back, so the next number has no gap", async () => {
    await createDoc("ok");
    await createDoc("ok");
    await expect(createDoc("fail")).rejects.toThrow();
    expect(counterValue("receipt", "2026-27")).toBe(2);
    await createDoc("ok");
    expect(await numbers()).toEqual([1, 2, 3]);
  });

  it("each financial year counts on its own", async () => {
    await createDoc("ok", "2026-27");
    await createDoc("ok", "2026-27");
    await createDoc("ok", "2027-28");
    expect(counterValue("receipt", "2026-27")).toBe(2);
    expect(counterValue("receipt", "2027-28")).toBe(1);
  });

  it("formats the patient code from settings, like P-000412", async () => {
    const { bump, value } = takeNumber(db, "patient_code", NEVER_RESETS, "system");
    await db.batch([
      bump,
      db.insert(docs).values({
        id: newUlid(),
        period: NEVER_RESETS,
        number: value,
        code: patientCodeSql(value),
        note: "ok",
      }),
    ]);
    const [row] = await db.select({ code: docs.code }).from(docs);
    expect(row?.code).toBe("P-000001");
  });
});
