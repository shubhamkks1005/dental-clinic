// Developer-only staff commands (never in the app). Emails are typed here and never stored in
// the repo. Remote targets need CLOUDFLARE_API_TOKEN in this terminal (typed with read -s).
//   pnpm staff:seed-doctor --env local|staging|production
//   pnpm staff:recover-doctor --env local|staging|production
import { spawnSync } from "node:child_process";
import { argv, env, exit, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { newUlid } from "../../../packages/shared/src/ulid.ts";
import { recoverDoctorSql, seedDoctorSql } from "./staff-sql.ts";

const [command, ...args] = argv.slice(2);
const target = args.includes("--env") ? args[args.indexOf("--env") + 1] : undefined;
if (
  !["seed-doctor", "recover-doctor"].includes(command) ||
  !["local", "staging", "production"].includes(target)
) {
  console.error("Usage: staff-admin.mjs seed-doctor|recover-doctor --env local|staging|production");
  exit(1);
}
if (target !== "local" && !env.CLOUDFLARE_API_TOKEN) {
  console.error("Set CLOUDFLARE_API_TOKEN in this terminal first (with read -s).");
  exit(1);
}

const wranglerEnv = {
  ...env,
  XDG_CONFIG_HOME: ".wrangler/config",
  WRANGLER_LOG_PATH: ".wrangler/logs",
  WRANGLER_SEND_METRICS: "false",
};
const where = target === "local" ? ["--local", "--env="] : ["--remote", "--env", target];
const wrangler = (wranglerArgs) =>
  spawnSync("node_modules/.bin/wrangler", wranglerArgs, { stdio: "inherit", env: wranglerEnv });

// Read answers line by line (rl.question loses buffered lines when input is piped).
const rl = createInterface({ input: stdin });
const lines = rl[Symbol.asyncIterator]();
const ask = async (prompt) => {
  stdout.write(prompt);
  const { value, done } = await lines.next();
  return done ? "" : value;
};
const ids = { userId: newUlid(), auditId: newUlid(), accessId: newUlid() };
let sql;
let summary;
try {
  if (command === "seed-doctor") {
    const email = await ask("Doctor's Gmail address: ");
    const name = await ask("Doctor's name as shown in the app (e.g. Dr. Nidhi Kushwaha): ");
    sql = seedDoctorSql({ ...ids, email, name });
    summary = `Add the first doctor (${email.trim().toLowerCase()}) on ${target}, only if no active doctor exists.`;
  } else {
    const oldEmail = await ask("Doctor's current (lost) Gmail address: ");
    const newEmail = await ask("Doctor's new Gmail address: ");
    sql = recoverDoctorSql({ ...ids, oldEmail, newEmail, nowIso: new Date().toISOString() });
    summary = `Change the doctor's email on ${target}, clear the Google link and end all her sessions.`;
  }
} catch (error) {
  console.error(error.message);
  exit(1);
}

console.log(`\n${summary}`);
const answer = await ask('Type "yes" to continue: ');
rl.close();
if (answer.trim() !== "yes") exit(0);

if (command === "recover-doctor" && target !== "local") {
  console.log("Restore point before the change (write it down):");
  wrangler(["d1", "time-travel", "info", "DB", ...where.slice(1)]);
}
const result = wrangler(["d1", "execute", "DB", ...where, "--command", sql]);
exit(result.status ?? 1);
