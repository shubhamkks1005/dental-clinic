import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import { fetchPatientMessages, sendPatientTemplate, type MessageRow } from "./api";
import "./messages.css";

const TEMPLATES = [
  { key: "recall", label: "Recall visit" },
  { key: "incomplete", label: "Next visit due" },
  { key: "dues", label: "Payment pending" },
] as const;

export function PatientMessagesTab({ patientId }: { patientId: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchPatientMessages(patientId);
      setRows(data.messages);
      setError(null);
    } catch (err) {
      setError(problemText(err));
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(templateKey: string) {
    setBusy(true);
    try {
      const { waUrl } = await sendPatientTemplate(patientId, templateKey);
      if (waUrl) window.open(waUrl, "_blank", "noopener,noreferrer");
      toast({ text: "Message ready. Send in WhatsApp if it opened.", tone: "ok" });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="messages-page" style={{ padding: 0 }}>
      <p className="muted">DRAFT - doctor to confirm. Only templates — no free text.</p>
      <div className="messages-toolbar">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => void send(t.key)}
          >
            Send on WhatsApp: {t.label}
          </button>
        ))}
      </div>
      {error && <p className="notice error">{error}</p>}
      {rows.length === 0 ? (
        <p className="muted">No messages yet for this patient.</p>
      ) : (
        <ul className="messages-list">
          {rows.map((row) => (
            <li key={row.id} className="messages-card">
              <p className="messages-meta">
                <strong>{row.kind}</strong> · {row.status}
              </p>
              <p className="messages-body">{row.body || "(no text)"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
