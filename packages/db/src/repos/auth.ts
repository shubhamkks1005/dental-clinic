import type { Role, UserStatus } from "@clinic/shared";
import { newUlid } from "@clinic/shared";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { accessInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import { settings, staffSessions, users } from "../schema";
import { nowUtcSql } from "../sql";

// Sign-in and session storage (1.3.8). This is the one repository without assertAllowed():
// it runs before anyone is signed in. It never returns patient data.
export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  googleSub: string | null;
};

export type SessionRow = {
  sessionId: string;
  expiresAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  user: { id: string; name: string; role: Role; status: UserStatus; deletedAt: string | null };
};

export type NewSession = {
  user: StaffUser;
  bindSub: string | null;
  tokenHash: string;
  expiresAt: string;
  userAgent: string | null;
  requestId: string;
};

const RESOURCE = "staff_session";

export function authRepo(db: Db) {
  return {
    async findStaffByEmail(email: string): Promise<StaffUser | undefined> {
      return db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          status: users.status,
          googleSub: users.googleSub,
        })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .get();
    },

    // One batch: bind the Google sub on first sign-in (only if still empty), stamp the sign-in,
    // create the session, and log it.
    async completeLogin(input: NewSession): Promise<string> {
      const { user, requestId } = input;
      const sessionId = newUlid();
      const actor = { userId: user.id, requestId };
      // The audit row must follow its UPDATE directly: auditInsertIfChanged reads changes().
      const bind: BatchItem<"sqlite">[] = input.bindSub
        ? [
            db
              .update(users)
              .set({
                googleSub: input.bindSub,
                version: sql`${users.version} + 1`,
                updatedAt: nowUtcSql,
                updatedBy: user.id,
              })
              .where(and(eq(users.id, user.id), isNull(users.googleSub))),
            auditInsertIfChanged(
              db,
              { ...actor, role: user.role },
              {
                action: "update",
                table: "users",
                rowId: user.id,
                before: { googleLink: "none" },
                after: { googleLink: "bound" },
              },
            ),
          ]
        : [];
      await db.batch([
        db.update(users).set({ lastLoginAt: nowUtcSql }).where(eq(users.id, user.id)),
        ...bind,
        db.insert(staffSessions).values({
          id: sessionId,
          userId: user.id,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          lastSeenAt: new Date().toISOString(),
          userAgent: input.userAgent,
          createdBy: user.id,
          updatedBy: user.id,
        }),
        accessInsert(db, actor, { action: "login", resource: RESOURCE, resourceId: sessionId }),
      ]);
      return sessionId;
    },

    async findSession(tokenHash: string): Promise<SessionRow | undefined> {
      const row = await db
        .select({
          sessionId: staffSessions.id,
          expiresAt: staffSessions.expiresAt,
          lastSeenAt: staffSessions.lastSeenAt,
          revokedAt: staffSessions.revokedAt,
          userId: users.id,
          name: users.name,
          role: users.role,
          status: users.status,
          deletedAt: users.deletedAt,
        })
        .from(staffSessions)
        .innerJoin(users, eq(users.id, staffSessions.userId))
        .where(eq(staffSessions.tokenHash, tokenHash))
        .get();
      if (!row) return undefined;
      const { userId, name, role, status, deletedAt, ...session } = row;
      return { ...session, user: { id: userId, name, role, status, deletedAt } };
    },

    async touchSession(sessionId: string): Promise<void> {
      await db
        .update(staffSessions)
        .set({ lastSeenAt: new Date().toISOString() })
        .where(eq(staffSessions.id, sessionId));
    },

    async logout(sessionId: string, actor: { userId: string; requestId: string }): Promise<void> {
      await db.batch([
        db
          .update(staffSessions)
          .set({
            revokedAt: new Date().toISOString(),
            updatedAt: nowUtcSql,
            updatedBy: actor.userId,
          })
          .where(and(eq(staffSessions.id, sessionId), isNull(staffSessions.revokedAt))),
        accessInsert(db, actor, { action: "logout", resource: RESOURCE, resourceId: sessionId }),
      ]);
    },

    async recordLoginProblem(
      action: "login_failed" | "login_denied",
      detail: string,
      requestId: string,
    ): Promise<void> {
      await accessInsert(
        db,
        { userId: "anonymous", requestId },
        { action, resource: RESOURCE, detail },
      );
    },

    // Public landing page data: clinic name and logo only, nothing else.
    async branding(): Promise<{ clinicName: string | null; logo: string | null }> {
      const rows = await db
        .select({ key: settings.key, valueJson: settings.valueJson })
        .from(settings)
        .where(
          and(inArray(settings.key, ["clinic.name", "clinic.logo"]), isNull(settings.deletedAt)),
        );
      const value = (key: string) => {
        const parsed = JSON.parse(rows.find((r) => r.key === key)?.valueJson ?? "null") as unknown;
        return typeof parsed === "string" ? parsed : null;
      };
      return { clinicName: value("clinic.name"), logo: value("clinic.logo") };
    },
  };
}

export type AuthRepo = ReturnType<typeof authRepo>;
