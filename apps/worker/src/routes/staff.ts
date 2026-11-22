import { Hono } from "hono";
import type { AppEnv } from "../types";
import { staffAuth } from "./staff-auth";
import { staffLists } from "./staff-lists";
import { staffSettings } from "./staff-settings";
import { staffUsers } from "./staff-users";

// /api/staff/*: every route needs a staff session (deny by default in app.ts) except the four
// paths in public-routes.ts. Each route declares its permission through the repositories.
export const staff = new Hono<AppEnv>();

staff.route("/", staffAuth);
staff.route("/", staffUsers);
staff.route("/", staffSettings);
staff.route("/", staffLists);
