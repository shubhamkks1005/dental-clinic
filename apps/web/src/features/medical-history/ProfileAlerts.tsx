import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { scopeKey } from "../../ui/request-scope";
import { useRequestScope } from "../../ui/RequestScope";
import { AlertsStrip } from "./AlertsStrip";
import { getAlertFlags, getMedicalHistory, type AlertRow } from "./api";

type Props = {
  patientId: string;
  canViewClinical: boolean;
  canSeeFlags: boolean;
};

/** Header strip on S04/S17: doctor gets labels; receptionist gets icon flags only (3.3.2 / 3.3.3). */
export function ProfileAlerts({ patientId, canViewClinical, canSeeFlags }: Props) {
  const scope = useRequestScope();
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [flags, setFlags] = useState<{ hasAlert: boolean; hasRestricted: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setAlerts(null);
    setFlags(null);
    if (canViewClinical) {
      scope
        .takeOr(scopeKey.medicalHistory(patientId), () => getMedicalHistory(patientId))
        .then((res) => {
          if (!cancelled) setAlerts(res.alerts);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : "Could not load alerts.");
          }
        });
    } else if (canSeeFlags) {
      scope
        .takeOr(scopeKey.alertFlags(patientId), () => getAlertFlags(patientId))
        .then((res) => {
          if (!cancelled) setFlags(res.flags);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : "Could not load alerts.");
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [patientId, canViewClinical, canSeeFlags, scope]);

  if (!canViewClinical && !canSeeFlags) return null;
  if (error) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (canViewClinical) {
    if (alerts === null) return <p className="muted patient-profile-alerts">Loading alerts…</p>;
    if (alerts.length === 0) return null;
    return (
      <div className="patient-profile-alerts">
        <AlertsStrip mode="full" alerts={alerts} />
      </div>
    );
  }
  if (flags === null) return <p className="muted patient-profile-alerts">Loading alerts…</p>;
  if (!flags.hasAlert) return null;
  return (
    <div className="patient-profile-alerts">
      <AlertsStrip mode="icon" flags={flags} />
      <span className="muted">
        {flags.hasRestricted ? "Doctor to check" : "Medical alert on file"}
      </span>
    </div>
  );
}
