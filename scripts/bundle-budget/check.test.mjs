import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BUDGET, firstLoadFiles, measureFirstLoad, measureJs, overBudget } from "./check.mjs";

describe("bundle budget (S0.1.2)", () => {
  it("passes at today's size (1,035,359 raw / 305,991 gzip; first load 906,565 / 266,508)", () => {
    const first = { raw: 906_565, gzip: 266_508 };
    expect(overBudget({ raw: 1_035_359, gzip: 305_991 }, BUDGET, first)).toEqual([]);
  });

  it("fails when the first load goes over its own limit (S3.1.3)", () => {
    const ok = { raw: 1, gzip: 1 };
    const rawOver = { raw: BUDGET.firstLoadRawBytes + 1, gzip: 1 };
    const gzipOver = { raw: 1, gzip: BUDGET.firstLoadGzipBytes + 1 };
    expect(overBudget(ok, BUDGET, rawOver)).toHaveLength(1);
    expect(overBudget(ok, BUDGET, gzipOver)).toHaveLength(1);
  });

  it("reads scripts, modulepreload and stylesheets from index.html, not other links", () => {
    const html = `<link rel="preload" href="/fonts/a.woff2" as="font">
      <script type="module" crossorigin src="/assets/index-1.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/vendor-2.js">
      <link rel="stylesheet" crossorigin href="/assets/index-3.css">
      <link rel="icon" href="/favicon.svg"><script src="https://cdn.example/x.js"></script>`;
    expect(firstLoadFiles(html)).toEqual([
      "/assets/index-1.js",
      "/assets/vendor-2.js",
      "/assets/index-3.css",
    ]);
  });

  it("measures the first-load files of a build, js and css together", () => {
    const dir = mkdtempSync(join(tmpdir(), "budget-"));
    try {
      mkdirSync(join(dir, "assets"));
      writeFileSync(join(dir, "assets/a.js"), "a".repeat(1000));
      writeFileSync(join(dir, "assets/lazy.js"), "z".repeat(5000));
      writeFileSync(join(dir, "assets/a.css"), "b".repeat(200));
      writeFileSync(
        join(dir, "index.html"),
        '<script type="module" src="/assets/a.js"></script><link rel="stylesheet" href="/assets/a.css">',
      );
      const first = measureFirstLoad(dir);
      expect(first.raw).toBe(1200);
      expect(first.files).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
