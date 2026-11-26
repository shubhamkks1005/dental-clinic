import { describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { countingDb } from "../testing/counting-d1";
import { createRepos } from "./index";

// Library P3.2.1 (Part S): D1 round trips per list request stay at 10 or fewer.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

describe("lists: round trips per request (P3.2.1)", () => {
  it("each Library request is 10 round trips or fewer", async () => {
    const t = countingDb();
    const lists = createRepos(t.db, doctor).lists;
    const trips = async (run: () => Promise<unknown>) => {
      t.reset();
      await run();
      return t.counts().roundTrips;
    };
    const got: Record<string, number> = {};
    got.seededList = await trips(() => lists.list("medicines"));
    let id = "";
    got.add = await trips(async () => {
      id = (await lists.addWithId("medicines", { label: "Count med", data: {} })).id;
    });
    got.list = await trips(() => lists.list("medicines"));
    const v = async () => (await lists.list("medicines")).find((i) => i.id === id)!.version;
    let version = await v();
    got.update = await trips(() =>
      lists.update("medicines", id, { label: "Count med", data: { strength: "1" } }, version),
    );
    version = await v();
    got.move = await trips(() => lists.move("medicines", id, "up", version));
    version = await v();
    got.moveTo = await trips(() => lists.moveTo("medicines", id, 1, version));
    await lists.add("medicine_sets", {
      label: "Count set",
      data: { items: "Count med|Paracetamol", item_ids: `${id}|x` },
    });
    version = await v();
    got.hide = await trips(() => lists.hideMedicine(id, version, true));
    got.usage = await trips(() => createRepos(t.db, doctor).prescriptions.medicineUsage());
    expect(got).toEqual({
      seededList: 1,
      list: 2,
      add: 4,
      update: 5,
      move: 5,
      moveTo: 5,
      hide: 7,
      usage: 1,
    });
    for (const n of Object.values(got)) expect(n).toBeLessThanOrEqual(10);
  });
});
