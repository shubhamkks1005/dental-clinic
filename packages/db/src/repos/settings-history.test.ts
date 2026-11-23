import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "user-doctor", role: "doctor", requestId: "req-1" };
const receptionist: Ctx = { userId: "user-rec", role: "receptionist", requestId: "req-2" };
const KEY = "clinic.name";

let t: ReturnType<typeof testDb>;

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO users (id, email, name, role, status, created_by, updated_by)
       VALUES ('user-doctor', 'doc@example.test', 'Dr Fake', 'doctor', 'active', 'system', 'system')`,
    )
    .run();
});

describe("settings history / restore (6.5.2)", () => {
  it("lists who/when/before after a change; restore puts the old value back as a new version", async () => {
    const settings = createRepos(t.db, doctor).settings;
    const hist = createRepos(t.db, doctor).settingsHistory;
    await settings.update(KEY, "Wrong Name", 1);
    const afterBad = await settings.get(KEY);
    expect(afterBad.value).toBe("Wrong Name");

    const entries = await hist.history(KEY);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0]).toMatchObject({
      byName: "Dr Fake",
      beforeValue: expect.any(String),
      afterValue: "Wrong Name",
    });

    const restored = await hist.restore(KEY, entries[0]!.id, afterBad.version);
    expect(restored.value).toBe(entries[0]!.beforeValue);
    expect(restored.version).toBe(afterBad.version + 1);
    expect((await settings.get(KEY)).value).toBe(entries[0]!.beforeValue);

    const again = await hist.history(KEY);
    expect(again[0]?.afterValue).toBe(entries[0]!.beforeValue);
  });

  it("receptionist can read history but cannot restore", async () => {
    const settings = createRepos(t.db, doctor).settings;
    await settings.update(KEY, "Temp", 1);
    const histDoc = createRepos(t.db, doctor).settingsHistory;
    const entries = await histDoc.history(KEY);
    const histRec = createRepos(t.db, receptionist).settingsHistory;
    await expect(histRec.history(KEY)).resolves.toHaveLength(entries.length);
    await expect(histRec.restore(KEY, entries[0]!.id, 2)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Q1.11: the desk cannot read the history of a billing setting", async () => {
    const hist = createRepos(t.db, receptionist).settingsHistory;
    await expect(hist.history("billing.gst_mode")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
