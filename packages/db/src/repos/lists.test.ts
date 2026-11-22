import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import {
  ConflictError,
  ForbiddenError,
  InvalidError,
  NotAllowedError,
  NotFoundError,
} from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

// 1.5.4 editable lists. Sample items only. 2.3.2 seeds seven visit types via migration.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const lists = (ctx: Ctx = doctor) => createRepos(t.db, ctx).lists;
const audits = () => t.sqlite.prepare("SELECT action, table_name FROM audit_log").all();
const labels = (items: { label: string }[]) => items.map((i) => i.label);

beforeEach(() => {
  t = testDb();
});

describe("editable lists (1.5.4 / 2.3.2)", () => {
  it("seeds the starter visit types with length and colour", async () => {
    const items = await lists().list("visit_types");
    expect(labels(items)).toEqual([
      "Consultation",
      "Follow-up",
      "Cleaning",
      "RCT sitting",
      "Extraction",
      "Ortho adjustment",
      "Emergency",
    ]);
    expect(items[0]?.data).toEqual({ minutes: 20, color: "#1E4FA3" });
    expect(items[6]?.data).toEqual({ minutes: 20, color: "#9A3412" });
  });

  it("adds items at the end with their own fields; each add is audited", async () => {
    await lists().add("visit_types", {
      label: "Test consult",
      data: { minutes: 20, color: "#1E4FA3" },
    });
    const items = await lists().add("visit_types", {
      label: " Test follow ",
      data: { minutes: 15, color: "#0b7a75" },
    });
    const added = items.filter((i) => i.label.startsWith("Test"));
    expect(added.map((i) => [i.label, i.data, i.active])).toEqual([
      ["Test consult", { minutes: 20, color: "#1E4FA3" }, true],
      ["Test follow", { minutes: 15, color: "#0B7A75" }, true],
    ]);
    expect(audits()).toEqual([
      { action: "create", table_name: "list_items" },
      { action: "create", table_name: "list_items" },
    ]);
  });

  it("lists are separate: the same name may be in two lists", async () => {
    await lists().add("referral_sources", { label: "Friend", data: {} });
    expect(labels(await lists().list("referral_sources"))).toEqual(["Friend"]);
  });

  it("refuses bad input, a duplicate name (any case) and unknown lists", async () => {
    await expect(
      lists().add("visit_types", { label: "X", data: { minutes: 1 } }),
    ).rejects.toBeInstanceOf(InvalidError);
    await lists().add("referral_sources", { label: "Friend", data: {} });
    await expect(
      lists().add("referral_sources", { label: "FRIEND", data: {} }),
    ).rejects.toBeInstanceOf(NotAllowedError);
    await expect(lists().list("nope")).rejects.toBeInstanceOf(NotFoundError);
    expect(audits()).toHaveLength(1);
  });

  it("edits with the version seen; an old version changes nothing (409)", async () => {
    const [item] = await lists().add("visit_types", {
      label: "Test RCT",
      data: { minutes: 45, color: "#B45309" },
    });
    if (!item) throw new Error("no item");
    const edited = await lists().update(
      "visit_types",
      item.id,
      { label: "Root canal", data: { minutes: 60, color: "#B45309" } },
      item.version,
    );
    expect(edited.find((i) => i.id === item.id)).toMatchObject({
      label: "Root canal",
      data: { minutes: 60, color: "#B45309" },
      version: item.version + 1,
    });
    await expect(
      lists().update(
        "visit_types",
        item.id,
        { label: "Old tab", data: { minutes: 30, color: "#B45309" } },
        item.version,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    const after = await lists().list("visit_types");
    expect(after.find((i) => i.id === item.id)?.label).toBe("Root canal");
  });

  it("hides and shows items (never deletes)", async () => {
    const [item] = await lists().add("referral_sources", { label: "Newspaper", data: {} });
    if (!item) throw new Error("no item");
    const hidden = await lists().setActive("referral_sources", item.id, false, 1);
    expect(hidden[0]).toMatchObject({ active: false, version: 2 });
    const shown = await lists().setActive("referral_sources", item.id, true, 2);
    expect(shown[0]).toMatchObject({ active: true, version: 3 });
    expect(
      t.sqlite
        .prepare("SELECT COUNT(*) AS n FROM list_items WHERE list_key = 'referral_sources'")
        .get(),
    ).toEqual({ n: 1 });
  });

  it("moves an item up or down by swapping with its neighbour; ends stay put", async () => {
    for (const label of ["A", "B", "C"]) await lists().add("referral_sources", { label, data: {} });
    const items = await lists().list("referral_sources");
    const c = items[2];
    if (!c) throw new Error("no item");
    const moved = await lists().move("referral_sources", c.id, "up", c.version);
    expect(labels(moved)).toEqual(["A", "C", "B"]);
    const top = moved[0];
    if (!top) throw new Error("no item");
    expect(labels(await lists().move("referral_sources", top.id, "up", top.version))).toEqual([
      "A",
      "C",
      "B",
    ]);
  });

  it("the receptionist can read lists but not change them", async () => {
    await lists().add("referral_sources", { label: "Friend", data: {} });
    expect(labels(await lists(receptionist).list("referral_sources"))).toEqual(["Friend"]);
    await expect(
      lists(receptionist).add("referral_sources", { label: "Walk-in", data: {} }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
