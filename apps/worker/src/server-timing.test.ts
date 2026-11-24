import { describe, expect, it } from "vitest";
import app from "./index";
import { makeEnv, ORIGIN } from "./testing/app-env";

// S0.1.1: every /api reply tells DevTools how long it took and how many queries it ran.
const FORMAT = /^total;dur=\d+, db;dur=\d+, queries;desc="\d+", statements;desc="\d+"$/;

describe("Server-Timing header", () => {
  it("is on /api replies, success and error, as numbers only", async () => {
    const { env } = makeEnv();
    for (const path of ["/api/staff/health", "/api/staff/me", "/api/nope"]) {
      const res = await app.request(`${ORIGIN}${path}`, {}, env);
      expect(res.headers.get("server-timing"), path).toMatch(FORMAT);
    }
  });

  it("counts the queries of that request", async () => {
    const { env } = makeEnv();
    const res = await app.request(`${ORIGIN}/api/staff/health`, {}, env);
    const queries = Number(
      /queries;desc="(\d+)"/.exec(res.headers.get("server-timing") ?? "")?.[1],
    );
    const statements = Number(
      /statements;desc="(\d+)"/.exec(res.headers.get("server-timing") ?? "")?.[1],
    );
    expect(queries).toBeGreaterThanOrEqual(1);
    expect(queries).toBeLessThan(50);
    // A batch is one round trip, so statements can never be fewer than round trips.
    expect(statements).toBeGreaterThanOrEqual(queries);
  });

  it("is not added to web pages", async () => {
    const { env } = makeEnv();
    const res = await app.request(`${ORIGIN}/some-page`, {}, env);
    expect(res.headers.get("server-timing")).toBeNull();
  });
});
