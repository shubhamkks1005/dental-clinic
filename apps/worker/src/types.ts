import type { Ctx, Db, Repos, SessionRow } from "@clinic/db";

// Secrets are set with `wrangler secret put` (never in wrangler.jsonc), so wrangler types
// does not know them. CF_VERSION_METADATA comes from wrangler version_metadata (1.6.2).
export type Bindings = Env & {
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_COOKIE_SECRET?: string;
  CF_VERSION_METADATA?: { id: string; tag?: string };
  // 3.7 file storage (B2/S3 or local R2). Secrets never go in wrangler.jsonc.
  STORAGE_DRIVER?: string;
  S3_ENDPOINT?: string;
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_KEY_ID?: string;
  S3_APP_KEY?: string;
  /** Test-only in-memory adapter (never set in wrangler). */
  __testStorage?: import("./adapters/storage").StorageAdapter;
};

// Set by the session middleware. session/ctx/repos exist only on signed-in routes.
export type Variables = {
  db: Db;
  requestId: string;
  session?: SessionRow;
  ctx?: Ctx;
  repos?: Repos;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
