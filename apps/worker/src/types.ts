import type { Ctx, Db, Repos, SessionRow } from "@clinic/db";

// Secrets are set with `wrangler secret put` (never in wrangler.jsonc), so wrangler types
// does not know them.
export type Bindings = Env & { GOOGLE_CLIENT_SECRET?: string; AUTH_COOKIE_SECRET?: string };

// Set by the session middleware. session/ctx/repos exist only on signed-in routes.
export type Variables = {
  db: Db;
  requestId: string;
  session?: SessionRow;
  ctx?: Ctx;
  repos?: Repos;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
