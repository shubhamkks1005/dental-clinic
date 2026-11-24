import { APPROVAL_TYPES, APPROVAL_TYPE_LABEL, type ApprovalType } from "@clinic/shared";
import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { Dialog } from "../../ui/Dialog";
import { Checkbox, Field, Select, TextInput } from "../../ui/form";
import { useSubmitOnce } from "../../ui/submit-guard";
import { createApproval } from "./doctor/doctor-api";

type Props = {
  open: boolean;
  patientName: string;
  appointmentId: string;
  onClose: () => void;
  onSent: () => void;
};

/** T2.8: the desk asks the doctor. Nearest design: the Cancel / Missed dialog (one choice, one note). */
export function AskDoctorDialog({ open, patientName, appointmentId, onClose, onSent }: Props) {
  const [type, setType] = useState<ApprovalType>("emergency_insert");
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useSubmitOnce();

  useEffect(() => {
    if (!open) return;
    setType("emergency_insert");
    setNote("");
    setDetail("");
    setUrgent(false);
    setError(null);
  }, [open]);

  async function send() {
    setError(null);
    try {
      await run(() =>
        createApproval({
          type,
          appointmentId,
          note: note.trim(),
          urgent,
          detail: detail.trim() || undefined,
        }),
      );
      onSent();
      onClose();
    } catch (e: unknown) {
      setError(problemText(e));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Ask the doctor · ${patientName}`}>
      <p className="muted small">
        The doctor answers Yes or No. You do the work yourself afterwards.
      </p>
      <Field label="What do you need?">
        {(p) => (
          <Select {...p} value={type} onChange={(e) => setType(e.target.value as ApprovalType)}>
            {APPROVAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {APPROVAL_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Note for the doctor" hint="Required, up to 200 letters.">
        {(p) => (
          <TextInput
            {...p}
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      <Field label="Time or detail (optional)" hint="For example 3:00 PM.">
        {(p) => (
          <TextInput
            {...p}
            value={detail}
            maxLength={60}
            onChange={(e) => setDetail(e.target.value)}
          />
        )}
      </Field>
      <label className="check-row">
        <Checkbox checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Urgent
      </label>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || note.trim() === ""}
          onClick={() => void send()}
        >
          {pending ? "Sending…" : "Send to the doctor"}
        </button>
      </div>
    </Dialog>
  );
}
