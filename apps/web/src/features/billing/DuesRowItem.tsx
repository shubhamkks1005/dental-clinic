import { formatDate, formatMoney, type DueAgeBucket } from "@clinic/shared";
import { useState } from "react";
import { Link } from "react-router";
import { problemText } from "../../api/problem-text";
import { PatientNoChip } from "../../ui/PatientNoChip";
import { useToast } from "../../ui/Toast";
import { sendPatientTemplate } from "../messages/api";
import { recordDuesCall, type DuesRow } from "./api";

const AGE_TONE: Record<DueAgeBucket, string> = {
  "0-30": "badge-done",
  "31-60": "badge-waiting",
  "61+": "badge-emergency",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function callText(r: DuesRow): string {
  if (!r.lastCallNote || !r.lastCallOn) return "Not called yet";
  return `Called ${formatDate(r.lastCallOn)}: ${r.lastCallNote}`;
}

// One patient who owes money. Phone: card with the action under the name. Laptop: one table row.
export function DuesRowItem({ row, onSaved }: { row: DuesRow; onSaved: () => void }) {
  const toast = useToast();
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveNote() {
    setBusy(true);
    try {
      await recordDuesCall(row.patientId, note);
      setNote("");
      setWriting(false);
      onSaved();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  function whatsApp() {
    setBusy(true);
    void sendPatientTemplate(row.patientId, "dues")
      .then(({ waUrl }) => {
        if (waUrl) window.open(waUrl, "_blank", "noopener,noreferrer");
        toast({ text: "WhatsApp opened with a payment-pending message.", tone: "ok" });
      })
      .catch((err) => toast({ text: problemText(err), tone: "error" }))
      .finally(() => setBusy(false));
  }

  return (
    <li className="dues-row">
      <div className="dues-who">
        <span className="dues-avatar" aria-hidden="true">
          {initials(row.patientName)}
        </span>
        <span className="dues-name">
          <Link to={`/app/patients/${row.patientId}?tab=billing`}>{row.patientName}</Link>
          <PatientNoChip patientNo={row.patientCode} />
        </span>
      </div>
      <strong className="dues-amount">{formatMoney(row.duePaise)}</strong>
      <span className={`badge ${AGE_TONE[row.bucket]} dues-age`}>{row.daysOutstanding} days</span>
      <span className="muted dues-note">{callText(row)}</span>
      <div className="dues-actions">
        <Link className="btn btn-primary" to={`/app/patients/${row.patientId}?tab=billing`}>
          Take payment
        </Link>
        <button type="button" className="btn" onClick={() => setWriting((w) => !w)}>
          Call note
        </button>
        <button type="button" className="btn" disabled={busy} onClick={whatsApp}>
          WhatsApp
        </button>
      </div>
      {writing ? (
        <div className="dues-write">
          <input
            className="input"
            aria-label={`Call note for ${row.patientName}`}
            placeholder="What did they say?"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || note.trim().length === 0}
            onClick={() => void saveNote()}
          >
            Save note
          </button>
        </div>
      ) : null}
    </li>
  );
}
