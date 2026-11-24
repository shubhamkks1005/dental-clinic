import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// S0.1.2 / S3.1.3: the built web app may not grow past these budgets.
// Measured 2026-11-24 after S3.1.1 + S3.1.2 (screens lazy, vendor chunks split):
//   all JS (36 chunks): 1,035,359 B raw, 305,991 B gzip. Before: 1 file, 1,029,300 / 289,003.
//   first load (index.html scripts + modulepreload + stylesheets, 30 files): 906,565 B raw,
//   266,508 B gzip. Before: 1 JS + 1 CSS file, 1,051,931 raw / about 294,200 gzip.
// S3.1.4: Hindi consent forms left the first load (consent-warning.ts split out): first load is now
//   853,241 B raw, 257,249 B gzip (was 906,565 / 266,508); its two limits sit about 6% above that.
// Each limit sits about 6% above the measured size. The total gzip limit went UP from 310,000
// because 36 small chunks gzip worse than one file; the owner decides whether that is fine. To raise a limit, the owner decides
// (docs/PLAN.md Part S rule 5); do not raise it just to make a build pass.
export const BUDGET = {
  // All .js files, lazy chunks included.
  jsRawBytes: 1_095_000,
  jsGzipBytes: 323_000,
  // Only what index.html loads straight away (JS + CSS), i.e. what the sign-in page downloads.
  firstLoadRawBytes: 905_000,
  firstLoadGzipBytes: 273_000,
};

function sizeOf(bytes) {
  return { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
}

// Sums every .js file in the built assets folder (lazy chunks count too).
export function measureJs(assetsDir) {
  let raw = 0;
  let gzip = 0;
  for (const name of readdirSync(assetsDir).filter((f) => f.endsWith(".js"))) {
    const size = sizeOf(readFileSync(join(assetsDir, name)));
    raw += size.raw;
    gzip += size.gzip;
  }
  return { raw, gzip };
}

// Files the page downloads before it can show anything: <script src>, rel=modulepreload and
// rel=stylesheet in index.html. Returns paths as written ("/assets/x.js").
export function firstLoadFiles(html) {
  const files = new Set();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const isScript = /^<script\b/i.test(tag);
    const rel = /\brel=["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    const wanted = isScript || /\b(modulepreload|stylesheet)\b/i.test(rel);
    const url = /\b(?:src|href)=["']([^"']+)["']/i.exec(tag)?.[1];
    if (wanted && url && url.startsWith("/") && !url.startsWith("//")) files.add(url);
  }
  return [...files];
}

// Size of the first-load files; distDir is the folder that holds index.html.
export function measureFirstLoad(distDir) {
  let raw = 0;
  let gzip = 0;
  const files = firstLoadFiles(readFileSync(join(distDir, "index.html"), "utf8"));
  for (const url of files) {
    const path = join(distDir, url);
    if (!existsSync(path)) throw new Error(`index.html names ${url}, but it is not in the build.`);
    const size = sizeOf(readFileSync(path));
    raw += size.raw;
    gzip += size.gzip;
  }
  return { raw, gzip, files: files.length };
}

// Returns plain-sentence failures; empty means within budget. `first` is optional.
export function overBudget({ raw, gzip }, budget = BUDGET, first) {
  const failures = [];
  if (raw > budget.jsRawBytes) failures.push(`JS is ${raw} bytes, limit ${budget.jsRawBytes}.`);
  if (gzip > budget.jsGzipBytes) {
    failures.push(`JS gzip is ${gzip} bytes, limit ${budget.jsGzipBytes}.`);
  }
  if (first && first.raw > budget.firstLoadRawBytes) {
    failures.push(`First load is ${first.raw} bytes, limit ${budget.firstLoadRawBytes}.`);
  }
  if (first && first.gzip > budget.firstLoadGzipBytes) {
    failures.push(`First load gzip is ${first.gzip} bytes, limit ${budget.firstLoadGzipBytes}.`);
  }
  return failures;
}
