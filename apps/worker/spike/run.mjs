// Runs spike 0.6.3 against the real throwaway D1 from this Mac. Needs CLOUDFLARE_API_TOKEN
// (typed with `read -s`, never stored) in the current terminal; the account id is in wrangler.spike.jsonc.
import { spawn } from "node:child_process";

const PORT = 8799;
const env = {
  ...process.env,
  XDG_CONFIG_HOME: ".wrangler/config",
  WRANGLER_LOG_PATH: ".wrangler/logs",
  WRANGLER_SEND_METRICS: "false",
};

if (!env.CLOUDFLARE_API_TOKEN) {
  console.error("Set CLOUDFLARE_API_TOKEN in this terminal first (with read -s).");
  process.exit(1);
}

const wrangler = (args, stdio) => spawn("node_modules/.bin/wrangler", args, { env, stdio });

function migrate() {
  return new Promise((resolve, reject) => {
    const child = wrangler(
      ["d1", "migrations", "apply", "DB", "--remote", "--config", "wrangler.spike.jsonc"],
      "inherit",
    );
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Migrations failed; see above.")),
    );
  });
}

function startDev() {
  return new Promise((resolve, reject) => {
    const child = wrangler(
      ["dev", "--config", "wrangler.spike.jsonc", "--port", String(PORT)],
      ["ignore", "pipe", "pipe"],
    );
    let log = "";
    const onData = (chunk) => {
      log += chunk;
      if (log.includes("Ready on")) resolve(child);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", () => reject(new Error(`wrangler dev stopped:\n${log}`)));
  });
}

await migrate();
const dev = await startDev();
try {
  const response = await fetch(`http://localhost:${PORT}/`);
  const report = await response.json();
  console.log(JSON.stringify(report, null, 2));
  for (const [name, result] of Object.entries(report))
    console.log(`${result.pass ? "PASS" : "FAIL"}  ${name}`);
  process.exitCode = Object.values(report).every((r) => r.pass) ? 0 : 1;
} finally {
  dev.kill();
}
