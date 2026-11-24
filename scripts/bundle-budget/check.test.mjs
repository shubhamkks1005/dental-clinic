import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BUDGET, measureJs, overBudget } from "./check.mjs";

describe("bundle budget (S0.1.2)", () => {
  it("passes at today's size (1,028,526 raw / 288,376 gzip)", () => {
    expect(overBudget({ raw: 1_028_526, gzip: 288_376 })).toEqual([]);
  });

  it("fails when raw or gzip goes over the limit", () => {
    expect(overBudget({ raw: BUDGET.jsRawBytes + 1, gzip: 1 })).toHaveLength(1);
    expect(overBudget({ raw: 1, gzip: BUDGET.jsGzipBytes + 1 })).toHaveLength(1);
  });

  it("measures every .js file and ignores other files", () => {
    const dir = mkdtempSync(join(tmpdir(), "budget-"));
    try {
      writeFileSync(join(dir, "a.js"), "a".repeat(1000));
      writeFileSync(join(dir, "b.js"), randomBytes(500));
      writeFileSync(join(dir, "c.css"), "x".repeat(9999));
      const { raw, gzip } = measureJs(dir);
      expect(raw).toBe(1500);
      expect(gzip).toBeGreaterThan(500);
      expect(gzip).toBeLessThan(raw);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
