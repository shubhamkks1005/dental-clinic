import { CANCEL_REASONS, CANCEL_REASON_LABEL, type CancelReasonCode } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { Dialog } from "../../ui/Dialog";
import { cancelAppointment, markMissed, undoCancelAppointment } from "./api";
import { Select, TextInput } from "../../ui/form";

type Props = {
  open: boolean;
  mode: "cancel" | "missed";
  patientName: string;
  appointment: { id: string; version: number };
  onClose: () => void;
  /** The caller shows the result at once (optimistic): called before the server is asked. */
  onStart?: () => void;
  /** The server said no: the caller puts things back. Without it the error shows in the dialog. */
  onFail?: (message: string) => void;
  /** `undo` is set after a cancel: put the appointment back (the toast offers it for 10 s). */
  onDone: (message: string, undo?: () => Promise<void>) => void;
};

// Q1.4: Cancel and Missed both need a reason. Cancel uses the fixed list (2.3.8); Missed is one line.
export function CancelMissedDialog({
  open,
  mode,
  patientName,
  appointment,
  onClose,
  onStart,
  onFail,
  onDone,
}: Props) {
  const [reason, setReason] = useState<CancelReasonCode>("patient_request");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason("patient_request");
    setDetail("");
    setError(null);
  }, [open]);

  const needsText = mode === "missed" || reason === "other";
  const missing = needsText && detail.trim() === "";

  async function submit() {
    setBusy(true);
    setError(null);
    onStart?.();
    try {
      if (mode === "cancel") {
        const version = await cancelAppointment(appointment.id, {
          version: appointment.version,
          reason,
          detail: detail.trim() || undefined,
        });
        onDone(`Cancelled ${patientName}'s appointment.`, () =>
          undoCancelAppointment(appointment.id, version),
        );
      } else {
        await markMissed(appointment.id, appointment.version, detail.trim());
        onDone(`${patientName} marked as missed. They are on the Call list.`);
      }
      onClose();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Could not save. Check the connection, then try again.";
      if (onFail) onFail(message);
      else setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "cancel" ? "Cancel appointment" : "Mark as missed"}
    >
      <div className="quick-book">
        <p>{patientName}</p>
        {mode === "cancel" ? (
          <label>
            Reason
            <Select
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value as CancelReasonCode)}
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>
                  {CANCEL_REASON_LABEL[r]}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <label>
          {mode === "missed" ? "Why did they miss it?" : "Note"}
          <TextInput
            className="input"
            value={detail}
            maxLength={150}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={mode === "missed" ? "For example: did not answer the phone" : "Optional"}
          />
        </label>
        {missing ? (
          <p className="muted small">
            {mode === "missed" ? "Add a short reason." : "Add a short note for Other."}
          </p>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || missing}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : mode === "cancel" ? "Cancel appointment" : "Mark missed"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
