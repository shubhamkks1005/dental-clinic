import type { Db } from "../client";
import type { Ctx } from "../context";
import { consentsRepo } from "./consents";
import { listsRepo } from "./lists";
import { patientArchiveRepo } from "./patient-archive";
import { patientDuplicatesRepo } from "./patient-duplicates";
import { patientsRepo } from "./patients";
import { settingsRepo } from "./settings";
import { staffRepo } from "./staff";

// All SQL lives in repositories. The Worker builds this once per request and hands it to
// domain functions; route files never touch the database (apps/worker architecture test).
export function createRepos(db: Db, ctx: Ctx) {
  return {
    settings: settingsRepo(db, ctx),
    staff: staffRepo(db, ctx),
    lists: listsRepo(db, ctx),
    patients: { ...patientsRepo(db, ctx), ...patientArchiveRepo(db, ctx) },
    patientDuplicates: patientDuplicatesRepo(db, ctx),
    consents: consentsRepo(db, ctx),
  };
}

export type Repos = ReturnType<typeof createRepos>;
