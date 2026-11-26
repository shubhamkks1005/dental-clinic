import type { ListItem } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

// 1.5.4 editable lists over HTTP. Sample items only.
let env: ReturnType<typeof makeEnv>["env"];
let doctor: string;
let receptionist: string;

const send = (method: string, path: string, cookie: string, body?: unknown) => {
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}/api/staff${path}`,
    {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    env,
  );
};
const itemsOf = async (res: Response) =>
  ((await res.json()) as { data: { items: ListItem[] } }).data.items;

beforeEach(async () => {
  let sqlite;
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc-a@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec-1@example.test", role: "receptionist" });
  doctor = await sessionCookie(env, "doc-a@example.test");
  receptionist = await sessionCookie(env, "rec-1@example.test");
});

describe("add a procedure from the visit (B6)", () => {
  const post = (cookie: string, body: unknown) => send("POST", "/lists/procedures", cookie, body);

  it("the doctor adds name and fee without a code and gets the new item back", async () => {
    const res = await post(doctor, {
      label: "Visit scaling (test)",
      data: { default_paise: 80000 },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { item: ListItem | null; items: ListItem[] } };
    expect(body.data.item).toMatchObject({
      label: "Visit scaling (test)",
      data: { default_paise: 80000 },
    });
    expect(body.data.items.some((i) => i.id === body.data.item?.id)).toBe(true);
  });

  it("refuses a missing fee, a fee that is not whole paise, and a receptionist", async () => {
    expect((await post(doctor, { label: "No fee (test)", data: {} })).status).toBe(400);
    expect(
      (await post(doctor, { label: "Half paise (test)", data: { default_paise: 150.5 } })).status,
    ).toBe(400);
    expect(
      (await post(receptionist, { label: "Desk (test)", data: { default_paise: 100 } })).status,
    ).toBe(403);
  });
});

describe("editable lists API (1.5.4)", () => {
  it("the doctor adds, edits, hides and moves; replies carry the fresh list", async () => {
    const added = await send("POST", "/lists/visit_types", doctor, {
      label: "Test consult",
      data: { minutes: 20, color: "#1E4FA3" },
    });
    expect(added.status).toBe(201);
    await send("POST", "/lists/visit_types", doctor, {
      label: "Test follow-up",
      data: { minutes: 15, color: "#0B7A75" },
    });
    const res = await send("GET", "/lists/visit_types", receptionist);
    const all = await itemsOf(res);
    const first = all.find((i) => i.label === "Test consult");
    const second = all.find((i) => i.label === "Test follow-up");
    if (!first || !second) throw new Error("items missing");

    const edited = await itemsOf(
      await send("PUT", `/lists/visit_types/${first.id}`, doctor, {
        label: "Checkup",
        data: { minutes: 20, color: "#1E4FA3" },
        version: first.version,
      }),
    );
    expect(edited.find((i) => i.id === first.id)?.label).toBe("Checkup");
    const hidden = await itemsOf(
      await send("POST", `/lists/visit_types/${second.id}/active`, doctor, {
        active: false,
        version: second.version,
      }),
    );
    expect(hidden.find((i) => i.id === second.id)?.active).toBe(false);
    const moved = await itemsOf(
      await send("POST", `/lists/visit_types/${second.id}/move`, doctor, {
        direction: "up",
        version: second.version + 1,
      }),
    );
    const labels = moved.map((i) => i.label);
    expect(labels.indexOf("Test follow-up")).toBeLessThan(labels.indexOf("Checkup"));
  });

  it("400 bad input, 422 duplicate, 409 stale, 404 unknown list, 403 receptionist change", async () => {
    expect(
      (await send("POST", "/lists/visit_types", doctor, { label: "X", data: {} })).status,
    ).toBe(400);
    await send("POST", "/lists/referral_sources", doctor, { label: "Friend", data: {} });
    expect(
      (await send("POST", "/lists/referral_sources", doctor, { label: "friend", data: {} })).status,
    ).toBe(422);
    const [item] = await itemsOf(await send("GET", "/lists/referral_sources", doctor));
    expect(
      (
        await send("PUT", `/lists/referral_sources/${item?.id}`, doctor, {
          label: "Y",
          data: {},
          version: 9,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await send("POST", `/lists/referral_sources/${item?.id}/move`, doctor, {
          direction: "sideways",
          version: 1,
        })
      ).status,
    ).toBe(400);
    expect((await send("GET", "/lists/nope", doctor)).status).toBe(404);
    expect(
      (await send("POST", "/lists/referral_sources", receptionist, { label: "Walk-in", data: {} }))
        .status,
    ).toBe(403);
  });
});

describe("Library routes (P2.1)", () => {
  const post = (path: string, cookie: string, body: unknown) => send("POST", path, cookie, body);
  const added = async (res: Response) =>
    ((await res.json()) as { data: { item: ListItem; items: ListItem[] } }).data;

  it("two same-name items: the reply names the new one", async () => {
    const a = await added(
      await post("/lists/medicines", doctor, { label: "Twinmed", data: { strength: "250 mg" } }),
    );
    const b = await added(
      await post("/lists/medicines", doctor, { label: "Twinmed", data: { strength: "500 mg" } }),
    );
    expect(b.item.id).not.toBe(a.item.id);
    expect(b.item.data.strength).toBe("500 mg");
    expect(b.item.data.default_dose).toBe("As directed");
  });

  it("move-to: 200, 400 bad place, 409 stale, 403 receptionist", async () => {
    for (const label of ["A (test)", "B (test)"]) {
      await post("/lists/referral_sources", doctor, { label, data: {} });
    }
    const [a] = await itemsOf(await send("GET", "/lists/referral_sources", doctor));
    if (!a) throw new Error("no item");
    const path = `/lists/referral_sources/${a.id}/move-to`;
    expect((await post(path, doctor, { position: 0, version: a.version })).status).toBe(400);
    expect((await post(path, doctor, { position: 2, version: 99 })).status).toBe(409);
    expect((await post(path, receptionist, { position: 2, version: a.version })).status).toBe(403);
    const res = await post(path, doctor, { position: 2, version: a.version });
    expect(res.status).toBe(200);
    expect((await itemsOf(res)).map((i) => i.label)).toEqual(["B (test)", "A (test)"]);
  });

  it("hide a medicine and remove it from its sets; receptionist 403", async () => {
    const m = await added(await post("/lists/medicines", doctor, { label: "Hidemed", data: {} }));
    const n = await added(await post("/lists/medicines", doctor, { label: "Keepmed", data: {} }));
    await post("/lists/medicine_sets", doctor, {
      label: "Pair (test)",
      data: { items: "Hidemed|Keepmed", item_ids: `${m.item.id}|${n.item.id}` },
    });
    const path = `/lists/medicines/${m.item.id}/hide`;
    const body = { version: m.item.version, removeFromSets: true };
    expect((await post(path, receptionist, body)).status).toBe(403);
    expect((await post(path, doctor, { version: m.item.version })).status).toBe(400);
    const res = await post(path, doctor, body);
    expect(res.status).toBe(200);
    const data = (
      (await res.json()) as {
        data: { items: ListItem[]; sets: ListItem[]; emptySets: string[] };
      }
    ).data;
    expect(data.items.find((i) => i.id === m.item.id)?.active).toBe(false);
    expect(data.sets.find((s) => s.label === "Pair (test)")?.data.items).toBe("Keepmed");
    expect(data.emptySets).toEqual([]);
  });

  it("medicine usage: shape for the doctor, 403 for the receptionist", async () => {
    const res = await send("GET", "/library/medicine-usage", doctor);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { data: { counts: unknown } }).data.counts).toEqual({});
    expect((await send("GET", "/library/medicine-usage", receptionist)).status).toBe(403);
  });
});
