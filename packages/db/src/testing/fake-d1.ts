import type { DatabaseSync } from "node:sqlite";

// A stand-in for Cloudflare D1 over Node's built-in SQLite, for tests only. It implements just
// what drizzle-orm/d1 calls. batch() is one transaction, like D1: any failure rolls back all.
type Params = unknown[];
// Optional: called with every statement that runs (query-plan guard, 1.2.8).
export type StatementLog = (sql: string, params: Params) => void;

class FakeStatement {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly sql: string,
    private readonly params: Params = [],
    private readonly log?: StatementLog,
  ) {}

  bind(...params: Params): FakeStatement {
    return new FakeStatement(this.sqlite, this.sql, params, this.log);
  }

  async all() {
    return this.allNow();
  }

  async run() {
    return this.runNow();
  }

  async raw() {
    this.log?.(this.sql, this.params);
    const stmt = this.sqlite.prepare(this.sql);
    stmt.setReturnArrays(true);
    return stmt.all(...this.params);
  }

  allNow() {
    this.log?.(this.sql, this.params);
    const results = this.sqlite.prepare(this.sql).all(...this.params);
    const changes = Number(this.sqlite.prepare("SELECT changes() AS n").get()?.n ?? 0);
    return { success: true, results, meta: { changes } };
  }

  runNow() {
    this.log?.(this.sql, this.params);
    const { changes, lastInsertRowid } = this.sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      results: [],
      meta: { changes: Number(changes), last_row_id: Number(lastInsertRowid) },
    };
  }
}

export class FakeD1 {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly log?: StatementLog,
  ) {}

  prepare(sql: string): FakeStatement {
    return new FakeStatement(this.sqlite, sql, [], this.log);
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
