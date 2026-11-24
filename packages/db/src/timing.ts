import type { D1Binding } from "./client";

// Per-request database timing (S0.1.1). Numbers only: no SQL text, no values, nothing about
// patients. The Worker wraps c.env.DB once per request and reads the totals at the end.
export type DbTimer = {
  /** D1 round trips so far. A db.batch is ONE round trip, however many statements it holds. */
  readonly queries: number;
  /** Statements run so far (a batch counts each of its statements). */
  readonly statements: number;
  /** Wall-clock ms with at least one query in flight (parallel queries are not added twice). */
  readonly busyMs: number;
};

type Timer = { queries: number; statements: number; busyMs: number };

// Minimal view of the D1 API that drizzle calls. Real D1 and FakeD1 both fit it.
type Stmt = {
  bind(...values: unknown[]): Stmt;
  all(...args: unknown[]): Promise<unknown>;
  run(...args: unknown[]): Promise<unknown>;
  raw(...args: unknown[]): Promise<unknown>;
  first(...args: unknown[]): Promise<unknown>;
};
type Binding = { prepare(sql: string): Stmt; batch(statements: Stmt[]): Promise<unknown> };

const EXECUTE = new Set(["all", "run", "raw", "first"]);

export function timeD1(d1: D1Binding): { d1: D1Binding; timer: DbTimer } {
  const timer: Timer = { queries: 0, statements: 0, busyMs: 0 };
  const inner = d1 as unknown as Binding;
  let inFlight = 0;
  let busySince = 0;

  async function measure<T>(statements: number, work: () => Promise<T>): Promise<T> {
    timer.queries += 1;
    timer.statements += statements;
    if (inFlight++ === 0) busySince = Date.now();
    try {
      return await work();
    } finally {
      if (--inFlight === 0) timer.busyMs += Date.now() - busySince;
    }
  }

  // batch() must receive the original statements, so the wrapper keeps them in a WeakMap.
  const originals = new WeakMap<object, Stmt>();

  function wrap(stmt: Stmt): Stmt {
    const proxy = new Proxy(stmt, {
      get(target, prop) {
        if (prop === "bind") return (...values: unknown[]) => wrap(target.bind(...values));
        if (typeof prop === "string" && EXECUTE.has(prop)) {
          const method = (target as never)[prop] as (...a: unknown[]) => Promise<unknown>;
          return (...args: unknown[]) => measure(1, () => method.apply(target, args));
        }
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    originals.set(proxy, stmt);
    return proxy;
  }

  const wrapped: Binding = {
    prepare: (sql) => wrap(inner.prepare(sql)),
    batch: (statements) =>
      measure(statements.length, () => inner.batch(statements.map((s) => originals.get(s) ?? s))),
  };
  return { d1: wrapped as unknown as D1Binding, timer };
}

// Server-Timing header value: total and db in ms, round trips (queries) and statements apart.
export function serverTimingValue(totalMs: number, timer: DbTimer): string {
  const n = (v: number) => Math.max(0, Math.round(v));
  return `total;dur=${n(totalMs)}, db;dur=${n(timer.busyMs)}, queries;desc="${n(timer.queries)}", statements;desc="${n(timer.statements)}"`;
}
