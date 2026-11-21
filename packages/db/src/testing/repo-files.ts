import { readdirSync, readFileSync } from "node:fs";
import { REPO_ROOT } from "./paths";

export type SourceFile = { path: string; text: string };

// App source under a repo folder (e.g. "apps/worker/src"), without tests and test helpers.
export function sourceFiles(dir: string): SourceFile[] {
  const base = `${REPO_ROOT}${dir}/`;
  return readdirSync(base, { recursive: true })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.includes("testing/"))
    .map((f) => ({ path: `${dir}/${f}`, text: readFileSync(`${base}${f}`, "utf8") }));
}
