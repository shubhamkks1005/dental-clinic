import { REPO_ROOT } from "@clinic/db/testing";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Cloudflare Access guards the paths app and api/staff. "/" must redirect on the server (static
// assets _redirects), not only in React: a client-side jump to /app never reaches Access (1.3.1).
describe("staff entry goes through Access", () => {
  it("_redirects sends / to /app with a server redirect", () => {
    const rules = readFileSync(`${REPO_ROOT}apps/web/public/_redirects`, "utf8")
      .split("\n")
      .map((line) => line.trim().split(/\s+/));
    expect(rules).toContainEqual(["/", "/app", "302"]);
  });
});
