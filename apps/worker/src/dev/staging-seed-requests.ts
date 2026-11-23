import type { Repos } from "@clinic/db";
import { closePatientRequest, createPatientRequest } from "../domain/patient-requests";
import { must, type Obj, type SeedReport } from "./staging-seed-core";

// Three fake patient requests (receptionist takes them in); the last one is closed by the doctor.
export async function seedRequests(doc: Repos, rec: Repos, ids: string[], report: SeedReport) {
  const types = ["copy", "correct", "withdraw_consent"] as const;
  for (const [i, type] of types.entries()) {
    const made = must(
      await createPatientRequest(rec, {
        patientId: ids[i + 10]!,
        type,
        body: "Fake request text (seed)",
      }),
      "request",
    );
    report.requests++;
    if (i === 2) {
      const note = "Fake closing note (seed)";
      const closed = await closePatientRequest(doc, (made as Obj).id, {
        status: "done",
        note,
        version: 1,
      });
      must(closed, "close request");
    }
  }
}
