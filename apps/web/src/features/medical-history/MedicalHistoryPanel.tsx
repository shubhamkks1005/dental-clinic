import { istDateTime } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getMedicalHistory, type AlertRow, type MedicalHistoryVersion } from "./api";
import { MedicalHistoryForm } from "./MedicalHistoryForm";
import "./medical-history.css";

type Props = {
  patientId: string;
  gender: "female" | "male" | "other";
  canEdit: boolean;
};

export function MedicalHistoryPanel({ patientId, gender, canEdit }: Props) {
  const [history, setHistory] = useState<MedicalHistoryVersion | null | undefined>(undefined);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    getMedicalHistory(patientId)
      .then((res) => {
        setHistory(res.history);
        setAlerts(res.alerts);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load medical history. Check the connection, then try again.",
        );
        setHistory(null);
      });
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing && canEdit) {
    return (
      <section className="mh-panel" aria-labelledby="mh-title">
        <h2 id="mh-title">Medical history</h2>
        <MedicalHistoryForm
          patientId={patientId}
          gender={gender}
          existing={history?.items}
          onSaved={() => {
            setEditing(false);
            load();
          }}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="mh-panel" aria-labelledby="mh-title">
      <div className="mh-head">
        <h2 id="mh-title">Medical history</h2>
        {canEdit && (
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            {history ? "Update" : "Add"}
          </button>
        )}
      </div>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {history === undefined && !error && <p className="muted">Loading…</p>}
      {history === null && !error && <p className="muted">No medical history recorded yet.</p>}
      {history && (
        <>
          <p className="muted mh-meta">
            Version {history.versionNo} · Last review {istDateTime(new Date(history.recordedAt))}
          </p>
          {alerts.length > 0 && (
            <ul className="mh-alert-list">
              {alerts.map((a) => (
                <li key={a.id} className={a.restricted ? "mh-alert-restricted" : "mh-alert"}>
                  {a.label}
                </li>
              ))}
            </ul>
          )}
          <ul className="mh-summary">
            {history.items
              .filter((i) => i.answer === "yes")
              .map((i) => (
                <li key={i.code}>
                  <strong>{i.label}</strong>
                  {i.note ? ` — ${i.note}` : ""}
                </li>
              ))}
          </ul>
          {history.items.every((i) => i.answer !== "yes") && (
            <p className="muted">No Yes answers on the latest checklist.</p>
          )}
        </>
      )}
    </section>
  );
}
