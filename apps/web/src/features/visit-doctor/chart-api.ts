import { api } from "../../api/client";
import type { PatientChart } from "../chart/api";
import type { Mark } from "./chart-model";

/** Save a group of marks in one request (handoff B9): all of them or none. */
export function saveMarks(patientId: string, visitId: string, marks: Mark[]) {
  return api<{ eventIds: string[]; chart: PatientChart }>(
    `/api/staff/patients/${patientId}/chart/events/batch`,
    {
      method: "POST",
      body: {
        visitId,
        events: marks.map((m) => ({
          toothFdi: m.toothFdi,
          surface: m.surface,
          conditionCode: m.conditionCode,
        })),
      },
    },
  );
}
