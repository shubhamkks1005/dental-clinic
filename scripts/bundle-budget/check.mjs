import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// S0.1.2: the built web app may not grow past this budget. Measured 2026-11-24: JS 1,028,526 B
// raw, 288,376 B gzip. The limits sit about 7% above that. To raise a limit, the owner decides
// (docs/PLAN.md Part S rule 5); do not raise it just to make a build pass.
export const BUDGET = { jsRawBytes: 1_100_000, jsGzipBytes: 310_000 };

// Sums every .js file in the built assets folder (lazy chunks count too).
export function measureJs(assetsDir) {
  let raw = 0;
  let gzip = 0;
  for (const name of readdirSync(assetsDir).filter((f) => f.endsWith(".js"))) {
    const bytes = readFileSync(join(assetsDir, name));
    raw += bytes.length;
    gzip += gzipSync(bytes, { level: 9 }).length;
  }
  return { raw, gzip };
}

// Returns plain-sentence failures; empty means within budget.
export function overBudget({ raw, gzip }, budget = BUDGET) {
  const failures = [];
  if (raw > budget.jsRawBytes) failures.push(`JS is ${raw} bytes, limit ${budget.jsRawBytes}.`);
  if (gzip > budget.jsGzipBytes) {
    failures.push(`JS gzip is ${gzip} bytes, limit ${budget.jsGzipBytes}.`);
  }
  return failures;
}
