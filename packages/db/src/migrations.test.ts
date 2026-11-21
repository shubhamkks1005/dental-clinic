import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import checksums from "../migrations/checksums.json";

// pnpm runs package scripts with packages/db as the working directory.
const DIR = "migrations";

const lock = checksums as Record<string, string>;
const sqlFiles = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

describe("migrations (1.2.2)", () => {
  it("every migration is locked (after adding one, run pnpm db:lock)", () => {
    expect(Object.keys(lock).sort()).toEqual(sqlFiles);
  });

  it("no locked migration was edited (put changes in a new migration)", () => {
    const edited = sqlFiles.filter((f) => lock[f] !== sha256(readFileSync(`${DIR}/${f}`, "utf8")));
    expect(edited).toEqual([]);
  });
});
