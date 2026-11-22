import { istDate } from "@clinic/shared";
import { openVisit } from "./api";

/** Open or reuse today's draft, then return its id for navigation (3.5.1). */
export async function openOrReuseVisit(opts: {
  patientId: string;
  appointmentId?: string | null;
  visitDateLocal?: string;
}): Promise<string> {
  const visit = await openVisit({
    patientId: opts.patientId,
    appointmentId: opts.appointmentId ?? null,
    visitDateLocal: opts.visitDateLocal ?? istDate(new Date()),
  });
  return visit.id;
}
