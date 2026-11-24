import type { DatabaseSync } from "node:sqlite";
import { createDb, type D1Binding } from "../client";
import { FakeD1 } from "./fake-d1";
import { migratedSqlite } from "./test-db";

type Stmt = Parameters<FakeD1["batch"]>[0];

class CountingD1 extends FakeD1 {
  batches = 0;
  batched = 0;
  statements = 0;
  constructor(sqlite: DatabaseSync) {
    super(sqlite, () => {
      this.statements++;
    });
  }
  override async batch(statements: Stmt) {
    this.batches++;
    this.batched += statements.length;
    return super.batch(statements);
  }
}

/**
 * A migrated test database that counts how often D1 is called. A db.batch is ONE round trip
 * (PLAN Part S); a statement outside a batch is one round trip each.
 */
export function countingDb() {
  const sqlite = migratedSqlite();
  const d1 = new CountingD1(sqlite);
  return {
    sqlite,
    db: createDb(d1 as unknown as D1Binding),
    reset: () => {
      d1.batches = 0;
      d1.batched = 0;
      d1.statements = 0;
    },
    counts: () => ({
      statements: d1.statements,
      batches: d1.batches,
      roundTrips: d1.batches + (d1.statements - d1.batched),
    }),
  };
}
