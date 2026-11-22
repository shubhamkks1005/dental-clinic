import { authRepo, createDb } from "@clinic/db";
import { FakeD1, migratedSqlite } from "@clinic/db/testing";
import { vi } from "vitest";
import { openSession } from "../domain/login";
import type { Bindings } from "../types";

// Test-only: a full Worker env over an in-memory migrated database (fake D1), fake assets,
// and helpers to add staff and get a signed-in session cookie.
export const ORIGIN = "https://clinic.test";

export function makeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const sqlite = migratedSqlite();
  const assetsFetch = vi.fn(async () => new Response("asset"));
  const env = {
    DB: new FakeD1(sqlite),
    ASSETS: { fetch: assetsFetch },
    MESSAGING_MODE: "dry_run",
    ACCESS_TEAM_DOMAIN: "",
    ACCESS_AUD: "",
    APP_ORIGIN: ORIGIN,
    GOOGLE_CLIENT_ID: "client-123",
    AUTH_MODE: "google",
    GOOGLE_CLIENT_SECRET: "google-secret",
    AUTH_COOKIE_SECRET: "cookie-secret",
    ...overrides,
  } as unknown as Bindings;
  return { env, sqlite, assetsFetch };
}

type StaffInput = {
  id: string;
  email: string;
  role?: string;
  status?: string;
  sub?: string | null;
};

export function addStaff(sqlite: ReturnType<typeof migratedSqlite>, s: StaffInput) {
  sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, status, google_sub, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, 'system', 'system')",
    )
    .run(
      s.id,
      s.email,
      `Test ${s.role ?? "doctor"}`,
      s.role ?? "doctor",
      s.status ?? "active",
      s.sub ?? null,
    );
}

// Returns the Cookie header for a fresh session of this user.
export async function sessionCookie(env: Bindings, email: string): Promise<string> {
  const db = createDb(env.DB);
  const user = await authRepo(db).findStaffByEmail(email);
  if (!user) throw new Error(`No staff user ${email}`);
  const token = await openSession(
    db,
    user,
    null,
    { userAgent: "test", requestId: "test" },
    Date.now(),
  );
  return `__Host-staff_session=${token}`;
}

export const sameOriginPost = (cookie?: string): RequestInit => ({
  method: "POST",
  headers: { origin: ORIGIN, "x-clinic-request": "1", ...(cookie ? { cookie } : {}) },
});
