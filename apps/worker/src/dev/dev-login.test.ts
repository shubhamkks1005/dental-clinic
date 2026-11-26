import { describe, expect, it } from "vitest";
import { addStaff, makeEnv } from "../testing/app-env";
import devWorker from "./dev-entry";

// P1.7.1: ?email= signs in locally as an existing active staff member (a second doctor).
const LOCAL = "http://localhost:8787/api/staff/auth/dev-login";

function call(url: string, env: Record<string, unknown>) {
  const ctx = { waitUntil: () => undefined, passThroughOnException: () => undefined };
  return devWorker.fetch(new Request(url), env as never, ctx as never);
}

describe("dev-login ?email= (local only)", () => {
  it("signs in as an existing active doctor; unknown or inactive email is 404", async () => {
    const { env, sqlite } = makeEnv({ AUTH_MODE: "dev-stub" });
    addStaff(sqlite, { id: "doc-b", email: "doc-b@example.test" });
    addStaff(sqlite, { id: "doc-x", email: "doc-x@example.test", status: "disabled" });
    const ok = await call(`${LOCAL}?email=Doc-B@example.test`, env as never);
    expect(ok.status).toBe(302);
    expect(ok.headers.get("set-cookie")).toContain("staff_session=");
    const session = sqlite.prepare("SELECT user_id FROM staff_sessions").get() as {
      user_id: string;
    };
    expect(session.user_id).toBe("doc-b");
    expect((await call(`${LOCAL}?email=nobody@example.test`, env as never)).status).toBe(404);
    expect((await call(`${LOCAL}?email=doc-x@example.test`, env as never)).status).toBe(404);
  });

  it("still refuses outside localhost", async () => {
    const { env } = makeEnv({ AUTH_MODE: "dev-stub" });
    const r = await call(
      "https://clinic.test/api/staff/auth/dev-login?email=doc@example.test",
      env as never,
    );
    expect(r.status).toBe(404);
  });
});
