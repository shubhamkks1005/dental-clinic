import type { Db } from "../client";
import type { Ctx } from "../context";
import { settingsRepo } from "./settings";

// All SQL lives in repositories. The Worker builds this once per request and hands it to
// domain functions; route files never touch the database (apps/worker architecture test).
export function createRepos(db: Db, ctx: Ctx) {
  return {
    settings: settingsRepo(db, ctx),
  };
}

export type Repos = ReturnType<typeof createRepos>;
