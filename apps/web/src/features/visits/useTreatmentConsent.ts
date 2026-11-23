import { hasActiveConsent } from "@clinic/shared";
import { useEffect, useState } from "react";
import { getPatientConsents } from "../patients/api";

/** undefined = not known (the warning is then left out). */
export function useTreatmentConsent(patientId: string): boolean | undefined {
  const [has, setHas] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getPatientConsents(patientId)
      .then((rows) => {
        if (!cancelled) setHas(hasActiveConsent(rows, "treatment"));
      })
      .catch(() => {
        if (!cancelled) setHas(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);
  return has;
}
