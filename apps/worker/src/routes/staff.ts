import { Hono } from "hono";
import type { AppEnv } from "../types";
import { staffAppointments } from "./staff-appointments";
import { staffAuth } from "./staff-auth";
import { staffConsents } from "./staff-consents";
import { staffLists } from "./staff-lists";
import { staffPatients } from "./staff-patients";
import { staffSettings } from "./staff-settings";
import { staffUsers } from "./staff-users";
import { staffVisits } from "./staff-visits";

// /api/staff/*: every route needs a staff session (deny by default in app.ts) except the four
// paths in public-routes.ts. Each route declares its permission through the repositories.
export const staff = new Hono<AppEnv>();

staff.route("/", staffAuth);
staff.route("/", staffUsers);
staff.route("/", staffSettings);
staff.route("/", staffLists);
staff.route("/", staffPatients);
staff.route("/", staffConsents);
staff.route("/", staffAppointments);
staff.route("/", staffVisits);
