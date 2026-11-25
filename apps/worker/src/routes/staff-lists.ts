import { fail, ok, parseVersionOnly } from "@clinic/shared";
import { Hono, type Context } from "hono";
import { addListItem, changeListItem, listItemsOf, type ListChange } from "../domain/lists";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// 1.5.4 editable lists API. GET for everyone with settings.read; changes need settings.write.
// Replies with the fresh items. Bad input 400, duplicate name 422, stale version 409.
export const staffLists = new Hono<AppEnv>();

const readBody = (c: Context<AppEnv>): Promise<unknown> => c.req.json().catch(() => null);
const field = (body: unknown, name: string): unknown =>
  typeof body === "object" && body !== null ? (body as Record<string, unknown>)[name] : undefined;

function change(toChange: (body: unknown, version: number) => ListChange | string) {
  return async (c: Context<AppEnv>) => {
    const body = await readBody(c);
    const version = parseVersionOnly(body);
    if (!version.ok) return c.json(fail("invalid", version.message), 400);
    const next = toChange(body, version.value.version);
    if (typeof next === "string") return c.json(fail("invalid", next), 400);
    const items = await changeListItem(
      signedIn(c).repos,
      c.req.param("key") ?? "",
      c.req.param("id") ?? "",
      next,
    );
    return c.json(ok({ items }));
  };
}

// Library: small read-only count per medicine (doctor only), placed before the :key routes.
staffLists.get("/library/medicine-usage", async (c) =>
  c.json(ok({ counts: await signedIn(c).repos.prescriptions.medicineUsage30d() })),
);

// Design 30: "popular" diagnoses and procedures for the visit page search (counts only, doctor only).
staffLists.get("/library/line-usage", async (c) =>
  c.json(ok(await signedIn(c).repos.visitDiagnoses.diagnosisProcedureUsage30d())),
);

staffLists.get("/lists/:key", async (c) =>
  c.json(ok({ items: await listItemsOf(signedIn(c).repos, c.req.param("key")) })),
);

// B6: the reply also names the new item (names are unique in a list), so the visit page can use it at once.
staffLists.post("/lists/:key", async (c) => {
  const body = await readBody(c);
  const items = await addListItem(signedIn(c).repos, c.req.param("key"), body);
  const label = field(body, "label");
  const wanted = typeof label === "string" ? label.trim().toLowerCase() : "";
  const item = items.find((i) => i.label.toLowerCase() === wanted) ?? null;
  return c.json(ok({ items, item }), 201);
});

staffLists.put(
  "/lists/:key/:id",
  change((body, version) => ({ kind: "update", input: body, version })),
);

staffLists.post(
  "/lists/:key/:id/active",
  change((body, version) => {
    const active = field(body, "active");
    return typeof active === "boolean" ? { kind: "active", active, version } : "Say show or hide.";
  }),
);

staffLists.post(
  "/lists/:key/:id/move",
  change((body, version) => {
    const direction = field(body, "direction");
    return direction === "up" || direction === "down"
      ? { kind: "move", direction, version }
      : "Say up or down.";
  }),
);
