import {
  fail,
  ok,
  parseGoogleReset,
  parseNewStaff,
  parseRoleChange,
  parseVersionOnly,
  type Parsed,
} from "@clinic/shared";
import { Hono, type Context } from "hono";
import { addStaff, changeStaff, listStaff, type StaffChange } from "../domain/staff";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// Settings > Staff (1.3.6). Doctor only: the staff repository answers 403 for anyone else.
export const staffUsers = new Hono<AppEnv>();

const readBody = (c: Context<AppEnv>): Promise<unknown> => c.req.json().catch(() => null);
const invalid = (c: Context<AppEnv>, message: string) => c.json(fail("invalid", message), 400);

function change<T>(parse: (input: unknown) => Parsed<T>, toChange: (value: T) => StaffChange) {
  return async (c: Context<AppEnv>) => {
    const parsed = parse(await readBody(c));
    if (!parsed.ok) return invalid(c, parsed.message);
    const id = c.req.param("id") ?? "";
    const staff = await changeStaff(signedIn(c).repos, id, toChange(parsed.value));
    return c.json(ok({ staff }));
  };
}

staffUsers.get("/users", async (c) => c.json(ok({ staff: await listStaff(signedIn(c).repos) })));

staffUsers.post("/users", async (c) => {
  const parsed = parseNewStaff(await readBody(c));
  if (!parsed.ok) return invalid(c, parsed.message);
  return c.json(ok({ staff: await addStaff(signedIn(c).repos, parsed.value) }), 201);
});

staffUsers.post(
  "/users/:id/deactivate",
  change(parseVersionOnly, (v) => ({ kind: "deactivate", ...v })),
);
staffUsers.post(
  "/users/:id/reactivate",
  change(parseVersionOnly, (v) => ({ kind: "reactivate", ...v })),
);
staffUsers.post(
  "/users/:id/role",
  change(parseRoleChange, (v) => ({ kind: "role", ...v })),
);
staffUsers.post(
  "/users/:id/google-reset",
  change(parseGoogleReset, (v) => ({ kind: "google_reset", ...v })),
);
