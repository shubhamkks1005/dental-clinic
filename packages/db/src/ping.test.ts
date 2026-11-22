import { describe, expect, it } from "vitest";
import { pingDb } from "./ping";
import { testDb } from "./testing/test-db";

describe("pingDb (1.6.2)", () => {
  it("succeeds on a migrated database", async () => {
    const { db } = testDb();
    await expect(pingDb(db)).resolves.toBeUndefined();
  });
});
