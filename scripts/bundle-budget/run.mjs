import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUDGET, measureJs, overBudget } from "./check.mjs";

// Run after `pnpm --filter @clinic/web build`. Exits 1 when the bundle is over budget.
const assets = join(dirname(fileURLToPath(import.meta.url)), "../../apps/web/dist/assets");
if (!existsSync(assets)) {
  console.error("No build found. Run `pnpm --filter @clinic/web build` first.");
  process.exit(1);
}
const size = measureJs(assets);
console.log(`JS raw ${size.raw} / ${BUDGET.jsRawBytes}, gzip ${size.gzip} / ${BUDGET.jsGzipBytes}`);
const failures = overBudget(size);
for (const line of failures) console.error(`Bundle too big: ${line}`);
process.exit(failures.length ? 1 : 0);
