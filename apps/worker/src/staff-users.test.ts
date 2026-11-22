import type { StaffMember } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sameOriginPost, sessionCookie } from "./testing/app-env";

// 1.3.6 Settings > Staff over HTTP. Fake people only.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
let doctor: string;

const post = (path: string, cookie: string, body: unknown) => {
  const init = sameOriginPost(cookie);
  return app.request(
    `${ORIGIN}/api/staff${path}`,
    {
      ...init,
      headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );
};
const get = (path: string, cookie: string) =>
  app.request(`${ORIGIN}/api/staff${path}`, { headers: { cookie } }, env);
const staffOf = async (res: Response) =>
  ((await res.json()) as { data: { staff: StaffMember[] } }).data.staff;

beforeEach(async () => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc-a@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec-1@example.test", role: "receptionist" });
  doctor = await sessionCookie(env, "doc-a@example.test");
});

describe("Settings > Staff API (1.3.6)", () => {
  it("the doctor sees the list; the receptionist gets 403 with a plain sentence", async () => {
    const res = await get("/users", doctor);
    expect(res.status).toBe(200);
    expect((await staffOf(res)).map((s) => s.id)).toEqual(["doc-a", "rec-1"]);

    const receptionist = await sessionCookie(env, "rec-1@example.test");
    const denied = await get("/users", receptionist);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ ok: false, error: { code: "forbidden" } });
    const add = await post("/users", receptionist, {
      name: "X",
      email: "x@example.test",
      role: "doctor",
    });
    expect(add.status).toBe(403);
  });

  it("adds a receptionist (201) and replies with the fresh list", async () => {
    const res = await post("/users", doctor, {
      name: "Meena Test",
      email: "Meena@Example.test",
      role: "receptionist",
    });
    expect(res.status).toBe(201);
    const added = (await staffOf(res)).find((s) => s.email === "meena@example.test");
    expect(added).toMatchObject({ name: "Meena Test", role: "receptionist", status: "active" });
  });

  it("bad input is 400 with the reason; a guard refusal is 422; a stale page is 409", async () => {
    const bad = await post("/users", doctor, { name: "", email: "x@example.test", role: "doctor" });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ error: { message: "Enter the person's name." } });

    const self = await post("/users/doc-a/deactivate", doctor, { version: 1 });
    expect(self.status).toBe(422);
    expect(await self.json()).toMatchObject({ error: { code: "not_allowed" } });

    const stale = await post("/users/rec-1/deactivate", doctor, { version: 9 });
    expect(stale.status).toBe(409);
  });

  it("deactivating signs the person out at once: their next request is 401", async () => {
    const receptionist = await sessionCookie(env, "rec-1@example.test");
    expect((await get("/me", receptionist)).status).toBe(200);
    const res = await post("/users/rec-1/deactivate", doctor, { version: 1 });
    expect(res.status).toBe(200);
    expect((await staffOf(res)).find((s) => s.id === "rec-1")?.status).toBe("disabled");
    expect((await get("/me", receptionist)).status).toBe(401);
  });

  it("role change applies on the person's next request", async () => {
    const receptionist = await sessionCookie(env, "rec-1@example.test");
    const res = await post("/users/rec-1/role", doctor, { role: "doctor", version: 1 });
    expect(res.status).toBe(200);
    const me = (await (await get("/me", receptionist)).json()) as { data: { role: string } };
    expect(me.data.role).toBe("doctor");
  });

  it("reactivate and Google link reset work through the API", async () => {
    await post("/users/rec-1/deactivate", doctor, { version: 1 });
    expect((await post("/users/rec-1/reactivate", doctor, { version: 2 })).status).toBe(200);
    const res = await post("/users/rec-1/google-reset", doctor, {
      email: "rec-new@example.test",
      version: 3,
    });
    expect(res.status).toBe(200);
    expect((await staffOf(res)).find((s) => s.id === "rec-1")).toMatchObject({
      email: "rec-new@example.test",
      googleLinked: false,
    });
  });

  it("changes need the CSRF header like every other POST", async () => {
    const res = await app.request(
      `${ORIGIN}/api/staff/users/rec-1/deactivate`,
      {
        method: "POST",
        headers: { origin: ORIGIN, cookie: doctor, "content-type": "application/json" },
        body: JSON.stringify({ version: 1 }),
      },
      env,
    );
    expect(res.status).toBe(403);
    expect(sqlite.prepare("SELECT status FROM users WHERE id = 'rec-1'").get()).toEqual({
      status: "active",
    });
  });
});
