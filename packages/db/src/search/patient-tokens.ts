import { buildSearchTokens, newUlid, type PatientTokenSource } from "@clinic/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../client";
import { patientSearch } from "../schema";

/** Delete + insert statements for one patient. Put them in the same db.batch() as the patient write. */
export function rebuildPatientSearchStatements(
  db: Db,
  patientId: string,
  source: PatientTokenSource,
  actor: string,
) {
  const tokens = buildSearchTokens(source);
  const clear = db.delete(patientSearch).where(eq(patientSearch.patientId, patientId));
  if (tokens.length === 0) return [clear] as const;
  const insert = db.insert(patientSearch).values(
    tokens.map((t) => ({
      id: newUlid(),
      patientId,
      token: t.token,
      kind: t.kind,
      createdBy: actor,
      updatedBy: actor,
    })),
  );
  return [clear, insert] as const;
}
