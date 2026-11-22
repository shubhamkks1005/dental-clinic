// 1.1.7: load 5,000 fake patients into local D1 only. Never staging/production.
//   pnpm db:seed
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { exit } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedSqlPath = join(here, "../../../packages/db/src/seed/seed-sql.ts");
const { buildLocalPatientSeedSql } = await import(pathToFileURL(seedSqlPath).href);

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

const statements = buildLocalPatientSeedSql(5000, 1);
const dir = join(tmpdir(), `clinic-seed-${Date.now()}`);
mkdirSync(dir, { recursive: true });

try {
  for (let i = 0; i < statements.length; i++) {
    const file = join(dir, `batch-${String(i).padStart(3, "0")}.sql`);
    writeFileSync(file, statements[i] + "\n", "utf8");
    const result = wrangler(["d1", "execute", "DB", "--local", "--env=", "--file", file]);
    if (result.status !== 0) {
      console.error(`Seed batch ${i + 1}/${statements.length} failed.`);
      exit(result.status ?? 1);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const check = wrangler([
  "d1",
  "execute",
  "DB",
  "--local",
  "--env=",
  "--command",
  "SELECT COUNT(*) AS n FROM patients WHERE deleted_at IS NULL;",
]);
if (check.status !== 0) exit(check.status ?? 1);

console.log("Local seed done: 5,000 fake patients. Open /app/patients after pnpm dev.");
