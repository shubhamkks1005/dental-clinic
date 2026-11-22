import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";
import { users } from "./users";

// One row per staff sign-in. The cookie holds a random token; only its SHA-256 is stored here.
// expires_at = sign-in + 12 h (absolute). Idle (60 min) is checked against last_seen_at.
export const staffSessions = sqliteTable("staff_sessions", {
  ...standardColumns(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  revokedAt: text("revoked_at"),
  userAgent: text("user_agent"),
});
