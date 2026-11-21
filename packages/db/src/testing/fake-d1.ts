import type { DatabaseSync } from "node:sqlite";

// A stand-in for Cloudflare D1 over Node's built-in SQLite, for tests only. It implements just
// what drizzle-orm/d1 calls. batch() is one transaction, like D1: any failure rolls back all.
type Params = unknown[];

class FakeStatement {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly sql: string,
    private readonly params: Params = [],
  ) {}

  bind(...params: Params): FakeStatement {
    return new FakeStatement(this.sqlite, this.sql, params);
  }

  async all() {
    return this.allNow();
  }

  async run() {
    return this.runNow();
  }

  async raw() {
    const stmt = this.sqlite.prepare(this.sql);
    stmt.setReturnArrays(true);
    return stmt.all(...this.params);
  }

  allNow() {
    const results = this.sqlite.prepare(this.sql).all(...this.params);
    const changes = Number(this.sqlite.prepare("SELECT changes() AS n").get()?.n ?? 0);
    return { success: true, results, meta: { changes } };
  }

  runNow() {
    const { changes, lastInsertRowid } = this.sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      results: [],
      meta: { changes: Number(changes), last_row_id: Number(lastInsertRowid) },
    };
  }
}

export class FakeD1 {
  constructor(private readonly sqlite: DatabaseSync) {}

  prepare(sql: string): FakeStatement {
    return new FakeStatement(this.sqlite, sql);
  }

  async batch(statements: FakeStatement[]) {
    this.sqlite.exec("BEGIN");
    try {
      const results = statements.map((s) => s.allNow());
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}
