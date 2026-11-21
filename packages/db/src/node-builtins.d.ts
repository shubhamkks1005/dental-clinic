// Minimal types for the Node built-ins used by db tests. The repo has no @types/node
// (not an approved dependency) and these tests only ever run under Node.
declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string): string[];
}

declare module "node:crypto" {
  export function createHash(algorithm: "sha256"): {
    update(data: string): { digest(encoding: "hex"): string };
  };
}
