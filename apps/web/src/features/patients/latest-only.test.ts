import { describe, expect, it } from "vitest";
import { createLatestOnly } from "./latest-only";

// Simulates fast typing: each query's reply arrives in a chosen order; only current replies are applied.
function run(order: number[], queries: string[]): string | null {
  const guard = createLatestOnly();
  let shown: string | null = null;
  const isCurrent = queries.map((q) => ({ q, ok: guard.begin() }));
  for (const i of order) if (isCurrent[i]!.ok()) shown = isCurrent[i]!.q;
  return shown;
}

describe("createLatestOnly", () => {
  const queries = ["a", "an", "ann"];
  it("in-order replies end on the last query", () => {
    expect(run([0, 1, 2], queries)).toBe("ann");
  });
  it("a slow old reply arriving last never overwrites the newest", () => {
    expect(run([2, 1, 0], queries)).toBe("ann");
    expect(run([1, 2, 0], queries)).toBe("ann");
  });
  it("shows nothing when only a stale reply arrives", () => {
    expect(run([0], queries)).toBeNull();
  });
  it("cancel drops pending replies", () => {
    const guard = createLatestOnly();
    const ok = guard.begin();
    guard.cancel();
    expect(ok()).toBe(false);
  });
});
