// Records the checksum of every new migration in migrations/checksums.json.
// Never rewrites an existing entry: a committed migration must not be edited (rule 1.2.2).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../migrations/", import.meta.url);
const lockFile = new URL("checksums.json", dir);
const lock = JSON.parse(readFileSync(lockFile, "utf8"));
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const edited = [];
for (const name of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  const sum = sha256(readFileSync(new URL(name, dir), "utf8"));
  if (!(name in lock)) {
    lock[name] = sum;
    console.log(`locked ${name}`);
  } else if (lock[name] !== sum) {
    edited.push(name);
  }
}

if (edited.length > 0) {
  console.error(`These migrations were edited after locking: ${edited.join(", ")}`);
  console.error("Undo the edit and put the change in a new migration instead.");
  process.exit(1);
}
writeFileSync(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
