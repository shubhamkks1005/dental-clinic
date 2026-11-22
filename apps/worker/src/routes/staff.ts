import { Hono } from "hono";
import type { AppEnv } from "../types";
import { staffAuth } from "./staff-auth";

// /api/staff/*: every route needs a staff session (deny by default in app.ts) except the four
// paths in public-routes.ts. Each route declares its permission through the repositories.
export const staff = new Hono<AppEnv>();

staff.route("/", staffAuth);
