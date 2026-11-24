import { api } from "../../api/client";

/** Prescriptions in the last 30 days per medicine (lower-case generic name). Doctor only. */
export const getMedicineUsage = () =>
  api<{ counts: Record<string, number> }>("/api/staff/library/medicine-usage").then(
    (r) => r.counts,
  );
