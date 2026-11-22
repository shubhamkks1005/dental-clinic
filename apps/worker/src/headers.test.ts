import { REPO_ROOT } from "@clinic/db/testing";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import app from "./index";
import { makeEnv, ORIGIN } from "./testing/app-env";

// 1.3.5: security headers on Worker replies, and the _headers rules for the web pages.
describe("security headers", () => {
  it("API replies carry CSP, HSTS, nosniff, frame and referrer rules, and are never cached", async () => {
    const { env } = makeEnv();
    for (const path of ["/api/staff/health", "/api/staff/me", "/hooks/anything"]) {
      const res = await app.request(`${ORIGIN}${path}`, {}, env);
      expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
      expect(res.headers.get("strict-transport-security")).toBe(
        "max-age=31536000; includeSubDomains",
      );
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("web pages get a strict CSP and the same protections from apps/web/public/_headers", () => {
    const rules = readFileSync(`${REPO_ROOT}apps/web/public/_headers`, "utf8");
    expect(rules.split("\n")[0]).toBe("/*");
    expect(rules).toMatch(
      /Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';/,
    );
    expect(rules).toMatch(/frame-ancestors 'none'/);
    expect(rules).toMatch(/Strict-Transport-Security: max-age=31536000/);
    expect(rules).toMatch(/X-Content-Type-Options: nosniff/);
    expect(rules).toMatch(/Permissions-Policy: camera=\(\)/);
    expect(rules).not.toMatch(/unsafe-inline|unsafe-eval/);
  });
});
