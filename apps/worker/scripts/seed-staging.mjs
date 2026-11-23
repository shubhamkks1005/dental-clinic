// Staging seed: ~30 fake patients and a fortnight of fake clinic life, made by the real
// domain functions. Refuses to run on anything but the staging database. Safe to re-run.
//
//   pnpm --filter @clinic/worker db:seed:staging -- --staging      (remote staging D1)
//   pnpm --filter @clinic/worker db:seed:staging -- --local        (dry rehearsal on local D1)
//
// Remote mode needs CLOUDFLARE_API_TOKEN typed in this terminal (read -rs). Never printed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { exit, argv } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workerDir = join(here, "..");
const STAGING_NAME = "dental-clinic-staging";
const LOCAL_NAME = "dental-clinic-local";
const wantsLocal = argv.includes("--local");
const wantsStaging = argv.includes("--staging");

if (wantsLocal === wantsStaging) {
  console.error(
    "Say where: add --staging (real staging D1) or --local (local rehearsal), not both.",
  );
  exit(1);
}

// The staging id comes from wrangler.jsonc, so there is one source of truth.
function stagingDatabaseId() {
  const text = readFileSync(join(workerDir, "wrangler.jsonc"), "utf8");
  const m = text.match(
    /"database_name":\s*"dental-clinic-staging",\s*"database_id":\s*"([0-9a-f-]{36})"/,
  );
  return m ? m[1] : null;
}

const target = wantsLocal
  ? { name: LOCAL_NAME, id: null }
  : { name: STAGING_NAME, id: stagingDatabaseId() };

// Guard: the only databases this script may touch.
if (target.name !== STAGING_NAME && target.name !== LOCAL_NAME) exit(1);
if (!wantsLocal && (!target.id || /^0{8}-/.test(target.id))) {
  console.error("Refusing: no real staging database id found in wrangler.jsonc.");
  exit(1);
}

const require = createRequire(join(workerDir, "../web/package.json"));
const { getPlatformProxy } = await import(
  pathToFileURL(createRequire(join(workerDir, "package.json")).resolve("wrangler")).href
);

let configPath = join(workerDir, "wrangler.jsonc");
let environment = undefined;
if (!wantsLocal) {
  // Minimal config: only the staging D1, marked remote. Nothing else can be reached.
  mkdirSync(join(workerDir, ".wrangler/tmp"), { recursive: true });
  configPath = join(workerDir, ".wrangler/tmp/seed-staging.jsonc");
  writeFileSync(
    configPath,
    JSON.stringify({
      name: "seed-staging",
      compatibility_date: "2025-01-01",
      d1_databases: [
        { binding: "DB", database_name: STAGING_NAME, database_id: target.id, remote: true },
      ],
    }),
  );
}

const env = {
  ...process.env,
  XDG_CONFIG_HOME: join(workerDir, ".wrangler/config"),
  WRANGLER_SEND_METRICS: "false",
};
Object.assign(process.env, env);
const proxy = await getPlatformProxy({
  configPath,
  environment,
  persist: wantsLocal ? { path: join(workerDir, ".wrangler/state") } : false,
});

try {
  const DB = proxy.env.DB;
  const tables = await DB.prepare("SELECT name FROM sqlite_master WHERE name = 'patients'").first();
  if (!tables) {
    console.error(
      "The database has no patients table. Apply migrations first (see docs/TESTING.md).",
    );
    exit(1);
  }
  const marked = await DB.prepare(
    "SELECT COUNT(*) AS n FROM patients WHERE notes LIKE 'STAGING-SEED%'",
  ).first();
  if (marked.n > 0) {
    console.log(`Already seeded (${marked.n} fake patients found). Nothing changed.`);
    exit(0);
  }

  const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
  const server = await createServer({
    root: workerDir,
    configFile: false,
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    logLevel: "error",
  });
  try {
    const mod = await server.ssrLoadModule(join(workerDir, "src/dev/staging-seed.ts"));
    const report = await mod.runStagingSeed(DB);
    console.log("Seed done:", JSON.stringify({ ...report, skipped: report.skipped.length }));
    if (report.skipped.length)
      console.log("Skipped (holidays or clashes):", report.skipped.slice(0, 5).join(" | "));
  } finally {
    await server.close();
  }
} finally {
  await proxy.dispose();
}
