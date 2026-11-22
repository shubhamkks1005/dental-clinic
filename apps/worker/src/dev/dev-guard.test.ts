import { REPO_ROOT, sourceFiles } from "@clinic/db/testing";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { makeEnv } from "../testing/app-env";
import devApp from "./dev-entry";

// The dev login stub must never reach staging or production (docs/AUTH_PLAN.md 7).
type Vars = { AUTH_MODE?: string };
type Config = { main: string; vars: Vars; env: Record<string, { main?: string; vars: Vars }> };

// wrangler.jsonc: whole-line // comments and trailing commas only (prettier output).
function readWranglerConfig(): Config {
  const text = readFileSync(`${REPO_ROOT}apps/worker/wrangler.jsonc`, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(text) as Config;
}

describe("dev login stub stays local", () => {
  const config = readWranglerConfig();

  it("only the local config starts at the dev entry; staging and production start at src/index.ts", () => {
    expect(config.main).toBe("src/dev/dev-entry.ts");
    expect(config.env.staging?.main).toBe("src/index.ts");
    expect(config.env.production?.main).toBe("src/index.ts");
  });

  it("AUTH_MODE is dev-stub only locally; staging and production use google", () => {
    expect(config.vars.AUTH_MODE).toBe("dev-stub");
    expect(config.env.staging?.vars.AUTH_MODE).toBe("google");
    expect(config.env.production?.vars.AUTH_MODE).toBe("google");
  });

  it("nothing outside src/dev imports the dev code", () => {
    const offenders = sourceFiles("apps/worker/src")
      .filter((f) => !f.path.includes("/src/dev/"))
      .filter((f) => /from\s+["'](\.{1,2}\/)+dev\/|from\s+["']@clinic\/db\/dev["']/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("the staging/production app has no dev-login route", async () => {
    const app = createApp();
    expect(app.routes.some((r) => r.path.includes("dev-login"))).toBe(false);
    const { env } = makeEnv({ AUTH_MODE: "dev-stub" });
    expect(
      (await app.request("http://localhost:8787/api/staff/auth/dev-login", {}, env)).status,
    ).toBe(401);
  });

  it("the local app logs in a fake user on localhost in dev-stub mode only", async () => {
    const local = makeEnv({ AUTH_MODE: "dev-stub", APP_ORIGIN: "http://localhost:8787" });
    const ok = await devApp.request(
      "http://localhost:8787/api/staff/auth/dev-login?role=receptionist",
      {},
      local.env,
    );
    expect(ok.status).toBe(302);
    expect(ok.headers.get("location")).toBe("/app");
    expect(ok.headers.get("set-cookie")).toMatch(/^__Host-staff_session=/);
    expect(local.sqlite.prepare("SELECT email, role FROM users").all()).toEqual([
      { email: "dev-receptionist@example.test", role: "receptionist" },
    ]);

    const elsewhere = await devApp.request(
      "https://clinic.test/api/staff/auth/dev-login",
      {},
      local.env,
    );
    const googleMode = makeEnv({ AUTH_MODE: "google" });
    const wrongMode = await devApp.request(
      "http://localhost:8787/api/staff/auth/dev-login",
      {},
      googleMode.env,
    );
    expect([elsewhere.status, wrongMode.status]).toEqual([404, 404]);
  });
});
