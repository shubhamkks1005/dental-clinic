import { istDateTime, type ConsentRow } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatientConsents } from "./api";
import "./consents.css";

const TYPE_LABEL: Record<ConsentRow["type"], string> = {
  privacy_notice: "Privacy notice",
  sms_reminders: "SMS reminders",
  marketing: "Marketing SMS",
  treatment: "Treatment",
  photo: "Photos",
  portal: "Patient portal",
};

// 2.1.9 Done when: for one patient, when / who / which notice version on one screen.
export function ConsentsPanel({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<ConsentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPatientConsents(patientId)
      .then((list) => {
        if (!cancelled) {
          setRows(list);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load consents. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <section className="consents" aria-labelledby="consents-title">
      <h2 id="consents-title">Consents</h2>
      <p className="muted consents-lead">When, who recorded it, and which notice version.</p>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {rows === null && !error && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="muted">No consents recorded yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="consents-list">
          {rows.map((r) => (
            <li key={r.id} className="consents-item">
              <span className="consents-type">{TYPE_LABEL[r.type]}</span>
              <span className={r.given ? "consents-given" : "consents-withdrawn"}>
                {r.given ? "Given" : "Withdrawn"}
              </span>
              <span className="muted">
                Notice v{r.noticeVersion} · {r.method} · {istDateTime(new Date(r.givenAt))}
              </span>
              <span className="muted">Recorded by {r.recordedByName ?? "staff"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
