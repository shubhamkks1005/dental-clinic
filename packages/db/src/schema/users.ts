import { ROLES, USER_STATUSES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// Staff only. Patients never get a users row (they use the portal tables, Phase 8).
// google_sub: Google's stable account id, bound on first sign-in and required to match afterwards.
export const users = sqliteTable(
  "users",
  {
    ...standardColumns(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: text("role", { enum: ROLES }).notNull(),
    status: text("status", { enum: USER_STATUSES }).notNull().default("active"),
    googleSub: text("google_sub").unique(),
    lastLoginAt: text("last_login_at"),
  },
  (t) => [
    check("users_role_check", oneOf(t.role.name, ROLES)),
    check("users_status_check", oneOf(t.status.name, USER_STATUSES)),
    check("users_email_lowercase", sql.raw(`"email" = lower("email")`)),
  ],
);
