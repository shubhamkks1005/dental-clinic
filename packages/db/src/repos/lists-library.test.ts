import { AS_DIRECTED } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotAllowedError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";
import { DUPLICATE_ITEM, STARTER_LIST } from "./lists";

// Library (2026-11-26): duplicates, "As directed", who/when, active-only order, drag, Q12 hide.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const lists = (ctx: Ctx = doctor) => createRepos(t.db, ctx).lists;
const labels = (items: { label: string }[]) => items.map((i) => i.label);
const med = (label: string, data: Record<string, string> = {}) => ({ label, data });

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES ('doc-a', 'a@example.test', 'Dr Fake Sharma', 'doctor', 'system', 'system')",
    )
    .run();
});

describe("duplicate rule (P1.5.1)", () => {
  it("same name + same data refused; case-insensitive", async () => {
    await lists().add("medicines", med("Testmed", { strength: "500 mg" }));
    await expect(lists().add("medicines", med("TESTMED", { strength: "500 mg" }))).rejects.toThrow(
      DUPLICATE_ITEM,
    );
  });

  it("same name + other strength allowed", async () => {
    await lists().add("medicines", med("Testmed", { strength: "500 mg" }));
    await lists().add("medicines", med("Testmed", { strength: "250 mg" }));
    const twins = (await lists().list("medicines")).filter((i) => i.label === "Testmed");
    expect(twins).toHaveLength(2);
  });

  it("update to equal another refused", async () => {
    await lists().add("medicines", med("Testmed", { strength: "500 mg" }));
    const { items, id } = await lists().addWithId("medicines", med("Testmed", { strength: "1 g" }));
    const b = items.find((i) => i.id === id)!;
    await expect(
      lists().update("medicines", id, med("Testmed", { strength: "500 mg" }), b.version),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});

describe("add and update (P1.5.2, P1.5.3, P1.5.4)", () => {
  it("add returns the new id; dose empty -> 'As directed'; form and strength stay blank", async () => {
    const { items, id } = await lists().addWithId("medicines", med("Onlyname"));
    const item = items.find((i) => i.id === id)!;
    expect(item.label).toBe("Onlyname");
    expect(item.data).toMatchObject({
      form: "",
      strength: "",
      default_dose: AS_DIRECTED,
      default_frequency: AS_DIRECTED,
      default_days: AS_DIRECTED,
      timing: AS_DIRECTED,
    });
    expect(items.at(-1)?.id).toBe(id);
  });

  it("update fills 'As directed' too", async () => {
    const { items, id } = await lists().addWithId("medicines", med("Upd", { default_dose: "1" }));
    const v = items.find((i) => i.id === id)!.version;
    const after = await lists().update("medicines", id, med("Upd", { default_dose: "" }), v);
    expect(after.find((i) => i.id === id)?.data.default_dose).toBe(AS_DIRECTED);
  });

  it("names resolved; system -> Starter list", async () => {
    const { items, id } = await lists().addWithId("diagnoses", med("Fake diagnosis"));
    const mine = items.find((i) => i.id === id)!;
    expect(mine.createdByName).toBe("Dr Fake Sharma");
    expect(mine.updatedByName).toBe("Dr Fake Sharma");
    expect(mine.createdAt).toMatch(/^\d{4}-/);
    const seeded = items.find((i) => i.id !== id)!;
    expect(seeded.createdByName).toBe(STARTER_LIST);
  });
});

describe("order among active items (P1.5.5, P1.5.6)", () => {
  async function abc() {
    for (const l of ["A", "H", "B", "C"]) await lists().add("referral_sources", med(l));
    let items = await lists().list("referral_sources");
    const h = items.find((i) => i.label === "H")!;
    items = await lists().setActive("referral_sources", h.id, false, h.version);
    return items;
  }
  const byLabel = (items: { label: string; id: string; version: number }[], l: string) =>
    items.find((i) => i.label === l)!;
  const activeOrder = async () =>
    labels((await lists().list("referral_sources")).filter((i) => i.active));

  it("active A, hidden H, active B: B up -> B above A in one call", async () => {
    const items = await abc();
    const b = byLabel(items, "B");
    await lists().move("referral_sources", b.id, "up", b.version);
    expect(await activeOrder()).toEqual(["B", "A", "C"]);
  });

  it("moveTo: first to last, last to first, same place = no change", async () => {
    let items = await abc();
    let a = byLabel(items, "A");
    items = await lists().moveTo("referral_sources", a.id, 3, a.version);
    expect(labels(items.filter((i) => i.active))).toEqual(["B", "C", "A"]);
    a = byLabel(items, "A");
    items = await lists().moveTo("referral_sources", a.id, 1, a.version);
    expect(labels(items.filter((i) => i.active))).toEqual(["A", "B", "C"]);
    const b = byLabel(items, "B");
    const same = await lists().moveTo("referral_sources", b.id, 2, b.version);
    expect(byLabel(same, "B").version).toBe(b.version);
  });

  it("moveTo: stale version 409; bad place 400; hidden item refused", async () => {
    const items = await abc();
    const a = byLabel(items, "A");
    await expect(lists().moveTo("referral_sources", a.id, 2, a.version + 5)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(lists().moveTo("referral_sources", a.id, 4, a.version)).rejects.toBeInstanceOf(
      InvalidError,
    );
    const h = byLabel(items, "H");
    await expect(lists().moveTo("referral_sources", h.id, 1, h.version)).rejects.toBeInstanceOf(
      InvalidError,
    );
    expect(await activeOrder()).toEqual(["A", "B", "C"]);
  });

  it("the receptionist cannot move", async () => {
    const items = await abc();
    const a = byLabel(items, "A");
    await expect(
      lists(receptionist).moveTo("referral_sources", a.id, 2, a.version),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("hide a medicine that is in sets (P1.5.7, Q12)", () => {
  async function setup() {
    const x = await lists().addWithId("medicines", med("Xmed"));
    const y = await lists().addWithId("medicines", med("Ymed"));
    const ids = (a: string[]) => a.join("|");
    await lists().add("medicine_sets", {
      label: "Set one",
      data: { items: "Xmed|Ymed", item_ids: ids([x.id, y.id]) },
    });
    await lists().add("medicine_sets", { label: "Set two", data: { items: "Ymed|xmed" } });
    await lists().add("medicine_sets", {
      label: "Only X",
      data: { items: "Xmed", item_ids: x.id },
    });
    const meds = await lists().list("medicines");
    return { x: meds.find((m) => m.id === x.id)!, y: y.id };
  }

  it("hide + remove from 2 sets in one batch; a set left empty is reported, not saved", async () => {
    const { x, y } = await setup();
    const r = await lists().hideMedicine(x.id, x.version, true);
    expect(r.items.find((m) => m.id === x.id)?.active).toBe(false);
    const set = (l: string) => r.sets.find((s) => s.label === l)!.data;
    expect(set("Set one")).toMatchObject({ items: "Ymed", item_ids: y });
    expect(set("Set two")).toMatchObject({ items: "Ymed" });
    expect(set("Only X")).toMatchObject({ items: "Xmed", item_ids: x.id });
    expect(r.emptySets).toEqual(["Only X"]);
  });

  it("hide only leaves the sets as they are", async () => {
    const { x } = await setup();
    const r = await lists().hideMedicine(x.id, x.version, false);
    expect(r.items.find((m) => m.id === x.id)?.active).toBe(false);
    expect(r.sets.find((s) => s.label === "Set one")?.data.items).toBe("Xmed|Ymed");
    expect(r.emptySets).toEqual([]);
  });

  it("stale medicine version -> 409 and nothing saved", async () => {
    const { x } = await setup();
    await expect(lists().hideMedicine(x.id, x.version + 1, true)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const sets = await lists().list("medicine_sets");
    expect(sets.find((s) => s.label === "Set one")?.data.items).toBe("Xmed|Ymed");
    expect((await lists().list("medicines")).find((m) => m.id === x.id)?.active).toBe(true);
  });

  it("the receptionist cannot hide", async () => {
    const { x } = await setup();
    await expect(lists(receptionist).hideMedicine(x.id, x.version, true)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
