import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

beforeEach(() => {
  t = testDb();
});

describe("print log estimate (4.4.1)", () => {
  it("records first print then marks reprint; receptionist cannot print estimate", async () => {
    const first = await repos().printLog.record({
      documentKind: "estimate",
      documentId: "patient-fake-1",
      documentVersion: 42,
    });
    expect(first.isReprint).toBe(false);

    const second = await repos().printLog.record({
      documentKind: "estimate",
      documentId: "patient-fake-1",
      documentVersion: 99,
    });
    expect(second.isReprint).toBe(true);

    const listed = await repos().printLog.listForDocument("estimate", "patient-fake-1");
    expect(listed).toHaveLength(2);
    expect(listed[0]?.isReprint).toBe(false);
    expect(listed[1]?.isReprint).toBe(true);

    await expect(
      repos(receptionist).printLog.record({
        documentKind: "estimate",
        documentId: "patient-fake-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("print log consent (4.4.2)", () => {
  it("allows receptionist to record a consent form print", async () => {
    const first = await repos(receptionist).printLog.record({
      documentKind: "consent",
      documentId: "patient-fake-1:extraction",
      documentVersion: 1,
    });
    expect(first.isReprint).toBe(false);
    const second = await repos(receptionist).printLog.record({
      documentKind: "consent",
      documentId: "patient-fake-1:extraction",
      documentVersion: 1,
    });
    expect(second.isReprint).toBe(true);
  });
});
