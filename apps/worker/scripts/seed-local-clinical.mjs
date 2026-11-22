// 3.10.5: load ~200 fake clinical histories into local D1 only. Never staging/production.
//   pnpm --filter @clinic/worker db:seed:clinical
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { exit } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "../../../packages/db/src/seed/fake-clinical-sql.ts");
const { buildFakeClinicalSeedSql } = await import(pathToFileURL(sqlPath).href);

const wranglerEnv = {
  ...process.env,
  XDG_CONFIG_HOME: ".wrangler/config",
  WRANGLER_LOG_PATH: ".wrangler/logs",
  WRANGLER_SEND_METRICS: "false",
};

function wrangler(args) {
  return spawnSync("node_modules/.bin/wrangler", args, {
    stdio: "inherit",
    env: wranglerEnv,
  });
}

const migrate = wrangler(["d1", "migrations", "apply", "DB", "--local", "--env="]);
if (migrate.status !== 0) exit(migrate.status ?? 1);

const statements = buildFakeClinicalSeedSql(200, 2);
const dir = join(tmpdir(), `clinic-clinical-seed-${Date.now()}`);
mkdirSync(dir, { recursive: true });

try {
  for (let i = 0; i < statements.length; i++) {
    const file = join(dir, `batch-${String(i).padStart(3, "0")}.sql`);
    writeFileSync(file, statements[i] + "\n", "utf8");
    const result = wrangler(["d1", "execute", "DB", "--local", "--env=", "--file", file]);
    if (result.status !== 0) {
      console.error("Clinical seed batch failed", i);
      exit(result.status ?? 1);
    }
  }
  console.log(`OK: seeded ${200} fake clinical patients (local only).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
