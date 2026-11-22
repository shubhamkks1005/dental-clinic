import type { Db } from "@clinic/db";
import { googleClient } from "./adapters/google-oidc";
import type { AuthConfig } from "./domain/login";
import type { Bindings } from "./types";

// Builds sign-in settings from env. null = Google sign-in not set up in this environment yet.
export function authConfig(env: Bindings): AuthConfig | null {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_COOKIE_SECRET, APP_ORIGIN } = env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !AUTH_COOKIE_SECRET || !APP_ORIGIN) return null;
  return {
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: `${APP_ORIGIN}/api/staff/auth/callback`,
    cookieSecret: AUTH_COOKIE_SECRET,
  };
}

export function loginDeps(env: Bindings, db: Db, config: AuthConfig) {
  return {
    db,
    config,
    google: googleClient(config.clientId, env.GOOGLE_CLIENT_SECRET ?? ""),
    nowMs: Date.now(),
  };
}
