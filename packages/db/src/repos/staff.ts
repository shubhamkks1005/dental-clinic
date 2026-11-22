import {
  isStaffRole,
  newUlid,
  STAFF_ROLES,
  type NewStaff,
  type StaffMember,
  type StaffRole,
} from "@clinic/shared";
import { and, asc, eq, inArray, isNull, ne, sql, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { accessInsert, accessInsertIfChanged, auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotAllowedError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { staffSessions, users } from "../schema";
import { nowUtcSql } from "../sql";

// Settings > Staff (1.3.6, docs/AUTH_PLAN.md 4). Doctor only. Users are never deleted.
// Guards live in the UPDATE itself, so two people saving at once can't break them:
// nobody changes their own account, and there is always at least one active doctor.
const RESOURCE = "users";

const MSG = {
  self: "You can't change your own account. Another doctor can do it, or ask the developer.",
  lastDoctor:
    "The clinic needs at least one active doctor. Add or reactivate another doctor first.",
  emailTaken:
    "This Gmail address is already on the staff list. If the person was deactivated, reactivate them.",
  roleFixed: "This account's role can't be changed here.",
};

const ACTIVE_DOCTORS = sql.raw(
  "(SELECT count(*) FROM users WHERE role = 'doctor' AND status = 'active' AND deleted_at IS NULL)",
);
// True unless this row is the last active doctor.
const keepsADoctor = sql`(${users.role} <> 'doctor' OR ${users.status} <> 'active' OR ${ACTIVE_DOCTORS} > 1)`;

type UserRow = typeof users.$inferSelect;
type Change = {
  set: Partial<Pick<UserRow, "status" | "role" | "email" | "googleSub">>;
  guard?: SQL;
  before: unknown;
  after: unknown;
  detail: string;
  endSessions?: boolean;
};

export function staffRepo(db: Db, ctx: Ctx) {
  const allowed = () => assertAllowed(ctx, "staff.manage");

  async function find(id: string): Promise<UserRow> {
    const row = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("This staff member");
    return row;
  }

  async function activeDoctors(): Promise<number> {
    const row = await db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "doctor"), eq(users.status, "active"), isNull(users.deletedAt)))
      .get();
    return row?.n ?? 0;
  }

  async function emailUsedByOther(email: string, id: string | null): Promise<boolean> {
    const row = await db
      .select({ id: users.id })
      .from(users)
      .where(id ? and(eq(users.email, email), ne(users.id, id)) : eq(users.email, email))
      .get();
    return row !== undefined;
  }

  // Checks before any change: permission, not yourself, record unchanged since the user saw it.
  async function load(id: string, expectedVersion: number): Promise<UserRow> {
    allowed();
    if (id === ctx.userId) throw new NotAllowedError(MSG.self);
    const row = await find(id);
    if (row.version !== expectedVersion) throw new ConflictError();
    return row;
  }

  // One batch: guarded UPDATE, then audit and access rows (written only if the UPDATE changed the
  // row), then optionally end all the person's sessions (only if this UPDATE happened).
  async function change(row: UserRow, c: Change): Promise<void> {
    const version = row.version + 1;
    const endSessions: BatchItem<"sqlite">[] = c.endSessions
      ? [
          db
            .update(staffSessions)
            .set({
              revokedAt: new Date().toISOString(),
              updatedAt: nowUtcSql,
              updatedBy: ctx.userId,
            })
            .where(
              and(
                eq(staffSessions.userId, row.id),
                isNull(staffSessions.revokedAt),
                sql`(SELECT version FROM users WHERE id = ${row.id}) = ${version}`,
              ),
            ),
        ]
      : [];
    try {
      const [updated] = await db.batch([
        db
          .update(users)
          .set({ ...c.set, version, updatedAt: nowUtcSql, updatedBy: ctx.userId })
          .where(
            and(
              eq(users.id, row.id),
              eq(users.version, row.version),
              ne(users.id, ctx.userId),
              c.guard,
            ),
          )
          .returning({ id: users.id }),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "users",
          rowId: row.id,
          before: c.before,
          after: c.after,
        }),
        accessInsertIfChanged(db, ctx, {
          action: "staff_change",
          resource: RESOURCE,
          resourceId: row.id,
          detail: c.detail,
        }),
        ...endSessions,
      ]);
      if (updated.length === 0) throw new ConflictError();
    } catch (err) {
      throw emailClash(err);
    }
  }

  return {
    async list(): Promise<StaffMember[]> {
      allowed();
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          googleSub: users.googleSub,
          lastLoginAt: users.lastLoginAt,
          version: users.version,
        })
        .from(users)
        .where(isNull(users.deletedAt))
        .orderBy(asc(users.status), asc(users.name));
      return rows.map(({ googleSub, ...row }) => ({
        ...row,
        googleLinked: googleSub !== null,
        isYou: row.id === ctx.userId,
      }));
    },

    async add(input: NewStaff): Promise<string> {
      allowed();
      if (await emailUsedByOther(input.email, null)) throw new NotAllowedError(MSG.emailTaken);
      const id = newUlid();
      try {
        await db.batch([
          db.insert(users).values({
            id,
            ...input,
            status: "active",
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          auditInsert(db, ctx, {
            action: "create",
            table: "users",
            rowId: id,
            after: { ...input, status: "active" },
          }),
          accessInsert(db, ctx, {
            action: "staff_change",
            resource: RESOURCE,
            resourceId: id,
            detail: `add ${input.role}`,
          }),
        ]);
      } catch (err) {
        throw emailClash(err);
      }
      return id;
    },

    // Signs the person out everywhere at once, in the same batch.
    async deactivate(id: string, expectedVersion: number): Promise<void> {
      const row = await load(id, expectedVersion);
      if (row.status !== "active") throw new NotAllowedError("This person is already deactivated.");
      if (row.role === "doctor" && (await activeDoctors()) <= 1) {
        throw new NotAllowedError(MSG.lastDoctor);
      }
      await change(row, {
        set: { status: "disabled" },
        guard: and(eq(users.status, "active"), keepsADoctor),
        before: { status: "active" },
        after: { status: "disabled" },
        detail: "deactivate",
        endSessions: true,
      });
    },

    async reactivate(id: string, expectedVersion: number): Promise<void> {
      const row = await load(id, expectedVersion);
      if (row.status !== "disabled") throw new NotAllowedError("This person is already active.");
      await change(row, {
        set: { status: "active" },
        guard: eq(users.status, "disabled"),
        before: { status: "disabled" },
        after: { status: "active" },
        detail: "reactivate",
      });
    },

    // Takes effect on the person's next request: the session check reads the role every time.
    async changeRole(id: string, role: StaffRole, expectedVersion: number): Promise<void> {
      const row = await load(id, expectedVersion);
      if (!isStaffRole(row.role)) throw new NotAllowedError(MSG.roleFixed);
      if (row.role === role) throw new NotAllowedError(`This person is already a ${role}.`);
      if (row.role === "doctor" && row.status === "active" && (await activeDoctors()) <= 1) {
        throw new NotAllowedError(MSG.lastDoctor);
      }
      await change(row, {
        set: { role },
        guard: and(inArray(users.role, [...STAFF_ROLES]), ne(users.role, role), keepsADoctor),
        before: { role: row.role },
        after: { role },
        detail: `role ${row.role} to ${role}`,
      });
    },

    // After a new Gmail address or a new Google account: the next Google sign-in with this email
    // links again. Old sessions end now.
    async resetGoogleLink(id: string, email: string, expectedVersion: number): Promise<void> {
      const row = await load(id, expectedVersion);
      if (await emailUsedByOther(email, id)) throw new NotAllowedError(MSG.emailTaken);
      await change(row, {
        set: { email, googleSub: null },
        before: { email: row.email, googleLink: row.googleSub ? "bound" : "none" },
        after: { email, googleLink: "none" },
        detail: "google link reset",
        endSessions: true,
      });
    },
  };
}

// Two people adding the same Gmail at the same moment: the UNIQUE index refuses the second one.
function emailClash(err: unknown): unknown {
  return err instanceof Error && /UNIQUE.*users\.email/.test(err.message)
    ? new NotAllowedError(MSG.emailTaken)
    : err;
}
