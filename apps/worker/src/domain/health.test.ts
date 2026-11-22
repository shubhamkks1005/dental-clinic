import { createDb } from "@clinic/db";
import { FakeD1, migratedSqlite } from "@clinic/db/testing";
import { describe, expect, it } from "vitest";
import { buildVersion, checkHealth } from "./health";

describe("buildVersion (1.6.2)", () => {
  it("uses the tag, then a short id, then dev", () => {
    expect(buildVersion({ id: "abcdefghijklmnop", tag: "v1" })).toBe("v1");
    expect(buildVersion({ id: "abcdefghijklmnop", tag: "  " })).toBe("abcdefghijkl");
    expect(buildVersion({ id: "abcdefghijklmnop" })).toBe("abcdefghijkl");
    expect(buildVersion(null)).toBe("dev");
    expect(buildVersion(undefined)).toBe("dev");
  });
});

describe("checkHealth (1.6.2)", () => {
  it("returns ok and the version when the database answers", async () => {
    const db = createDb(new FakeD1(migratedSqlite()) as never);
    await expect(checkHealth(db, "abc")).resolves.toEqual({
      ok: true,
      data: { status: "ok", version: "abc" },
    });
  });

  it("returns unhealthy when the database throws", async () => {
    const db = {
      run: async () => {
        throw new Error("D1 down");
      },
    } as never;
    await expect(checkHealth(db, "abc")).resolves.toEqual({
      ok: false,
      message: "The clinic database did not answer. Try again in a minute.",
    });
  });
});
