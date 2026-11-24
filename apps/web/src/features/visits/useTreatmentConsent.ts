import { hasActiveConsent } from "@clinic/shared";
import { useEffect, useState } from "react";
import { scopeKey } from "../../ui/request-scope";
import { useRequestScope } from "../../ui/RequestScope";
import { getPatientConsents } from "../patients/api";

/** undefined = not known (the warning is then left out). */
export function useTreatmentConsent(patientId: string): boolean | undefined {
  const [has, setHas] = useState<boolean | undefined>(undefined);
  const scope = useRequestScope();
  useEffect(() => {
    let cancelled = false;
    scope
      .takeOr(scopeKey.consents(patientId), () => getPatientConsents(patientId))
      .then((rows) => {
        if (!cancelled) setHas(hasActiveConsent(rows, "treatment"));
      })
      .catch(() => {
        if (!cancelled) setHas(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, scope]);
  return has;
}
