import { describe, expect, it } from "vitest";
import { testDb } from "../testing/test-db";
import { countersListRepo } from "./counters-list";

describe("countersListRepo (6.5.1)", () => {
  it("lists counters for doctor and receptionist (settings.read); shape only, no PHI", async () => {
    const { db } = await testDb();
    const doctor = { userId: "u-doc", role: "doctor" as const, requestId: "r1" };
    const list = await countersListRepo(db, doctor).list();
    expect(Array.isArray(list)).toBe(true);
    for (const row of list) {
      expect(row).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          period: expect.any(String),
          value: expect.any(Number),
        }),
      );
    }
    const reception = { userId: "u-rec", role: "receptionist" as const, requestId: "r2" };
    await expect(countersListRepo(db, reception).list()).resolves.toEqual(list);
  });
});
