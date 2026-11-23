import { describe, expect, it } from "vitest";
import { sourceFiles, type SourceFile } from "./testing";

/** 6.5.3: banned hard-codes must not return outside allow-listed modules. */
const BANNED: { re: RegExp; label: string }[] = [
  { re: /NO_SHOW_AFTER_MINUTES\s*=\s*15\b/, label: "NO_SHOW_AFTER_MINUTES = 15" },
  { re: /STATUS_UNDO_HOURS\s*=\s*24\b/, label: "STATUS_UNDO_HOURS = 24" },
  { re: /AUTO_REFRESH_MS\s*=\s*60_?000\b/, label: "AUTO_REFRESH_MS = 60000" },
  { re: /STORAGE_WARN_BYTES\s*=\s*7\s*\*/, label: "STORAGE_WARN_BYTES = 7 *" },
  { re: /INCOMPLETE_DAYS_DEFAULT\s*=\s*30\b/, label: "INCOMPLETE_DAYS_DEFAULT = 30" },
  { re: /RECALL_MIN_MONTHS_DEFAULT\s*=\s*6\b/, label: "RECALL_MIN_MONTHS_DEFAULT = 6" },
  { re: /RECALL_MAX_MONTHS_DEFAULT\s*=\s*9\b/, label: "RECALL_MAX_MONTHS_DEFAULT = 9" },
];

const ALLOW = [
  "packages/shared/src/tunables.ts",
  "packages/shared/src/tunables.test.ts",
  "packages/db/src/tunables-guard.test.ts",
];

const APP_SOURCE = ["apps/worker/src", "apps/web/src", "packages/db/src", "packages/shared/src"];

function offenders(files: SourceFile[]): string[] {
  const hits: string[] = [];
  for (const f of files) {
    if (ALLOW.some((a) => f.path.includes(a))) continue;
    for (const ban of BANNED) {
      if (ban.re.test(f.text)) hits.push(`${f.path}: ${ban.label}`);
    }
  }
  return hits;
}

describe("tunables magic-number guard (6.5.3)", () => {
  it("banned hard-coded magic numbers stay out of feature code", () => {
    const files = APP_SOURCE.flatMap(sourceFiles);
    expect(offenders(files)).toEqual([]);
  });

  it("the guard catches a planted hard-code", () => {
    expect(
      offenders([{ path: "bad.ts", text: "export const NO_SHOW_AFTER_MINUTES = 15;" }]),
    ).toEqual(["bad.ts: NO_SHOW_AFTER_MINUTES = 15"]);
  });
});
