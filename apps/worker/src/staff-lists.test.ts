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
