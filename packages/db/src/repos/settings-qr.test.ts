import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

// A 1x1 PNG as a data URL: the smallest picture the setting accepts.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

beforeEach(() => {
  t = testDb();
});

describe("QR picture setting (the doctor's QR on the prescription)", () => {
  it("starts empty, stays out of the list of all settings, and both roles can read it", async () => {
    expect((await repos().settings.list()).some((s) => s.key === "clinic.qr_image")).toBe(false);
    expect(await repos().settings.get("clinic.qr_image")).toEqual({ value: null, version: 1 });
    expect((await repos(receptionist).settings.get("clinic.qr_image")).value).toBeNull();
  });

  it("the doctor saves a PNG, it comes back, and can be removed again", async () => {
    const saved = await repos().settings.update("clinic.qr_image", PNG, 1);
    expect(saved.value).toBe(PNG);
    const gone = await repos().settings.update("clinic.qr_image", null, saved.version);
    expect(gone.value).toBeNull();
  });

  it("refuses a receptionist, another file type, text that is not a picture and a big picture", async () => {
    await expect(
      repos(receptionist).settings.update("clinic.qr_image", PNG, 1),
    ).rejects.toBeInstanceOf(ForbiddenError);
    for (const bad of [
      "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      "data:text/html;base64,PGgxPg==",
      "https://example.test/qr.png",
      `data:image/png;base64,${"A".repeat(60_000)}`,
    ]) {
      await expect(
        repos().settings.update("clinic.qr_image", bad, 1),
        bad.slice(0, 30),
      ).rejects.toBeInstanceOf(InvalidError);
    }
  });
});
