import { api } from "../../api/client";

/** Per medicine name (lower-case): visits the signed-in doctor wrote it for, total and last 30 days. */
export type MedicineUsage = { total: number; last30: number };

export const getMedicineUsage = () =>
  api<{ counts: Record<string, MedicineUsage> }>("/api/staff/library/medicine-usage").then(
    (r) => r.counts,
  );
