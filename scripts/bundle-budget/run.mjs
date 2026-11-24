import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUDGET, measureFirstLoad, measureJs, overBudget } from "./check.mjs";

// Run after `pnpm --filter @clinic/web build`. Exits 1 when the bundle is over budget.
const dist = join(dirname(fileURLToPath(import.meta.url)), "../../apps/web/dist");
const assets = join(dist, "assets");
if (!existsSync(assets)) {
  console.error("No build found. Run `pnpm --filter @clinic/web build` first.");
  process.exit(1);
}
const size = measureJs(assets);
const first = measureFirstLoad(dist);
console.log(
  `JS total  raw ${size.raw} / ${BUDGET.jsRawBytes}, gzip ${size.gzip} / ${BUDGET.jsGzipBytes}`,
);
console.log(
  `First load (${first.files} files, JS+CSS) raw ${first.raw} / ${BUDGET.firstLoadRawBytes}, gzip ${first.gzip} / ${BUDGET.firstLoadGzipBytes}`,
);
const failures = overBudget(size, BUDGET, first);
for (const line of failures) console.error(`Bundle too big: ${line}`);
process.exit(failures.length ? 1 : 0);
