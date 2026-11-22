import type { Context } from "hono";
import type { CookieOptions } from "hono/utils/cookie";
import type { AppEnv } from "./types";

// __Host- cookies: Secure, Path=/, no Domain (Hono enforces this for prefix "host").
export const COOKIE_BASE = {
  prefix: "host",
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
} as const satisfies CookieOptions;

// For routes behind the session middleware; it always sets these.
export function signedIn(c: Context<AppEnv>) {
  const { session, ctx, repos } = c.var;
  if (!session || !ctx || !repos) throw new Error("Signed-in route reached without a session");
  return { session, ctx, repos };
}
