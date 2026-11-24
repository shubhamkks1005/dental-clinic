import { formatClockTime, formatDate } from "@clinic/shared";
import { useState } from "react";
import { TextInput } from "../../ui/form";

export type LateEntryValue = { startMin: number; endMin: number; reason: string };

type Props = {
  dateLocal: string;
  /** Usual length of the chosen visit type. */
  minutes: number;
  value: LateEntryValue | null;
  onChange: (value: LateEntryValue | null) => void;
};

const toMin = (hhmm: string): number | null => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// PA-M06: a booking outside opening hours, on a closed day or at a time already past. It needs a
// reason, which the server writes to the audit log; the visit is marked as an extra booking.
export function LateEntry({ dateLocal, minutes, value, onChange }: Props) {
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const start = toMin(time);
  const ready = start !== null && start + minutes <= 1440 && reason.trim().length >= 3;

  if (value) {
    return (
      <p className="small quick-book-late-set" role="status">
        Late entry: {formatDate(dateLocal)}, {formatClockTime(value.startMin)}. Reason:{" "}
        {value.reason}{" "}
        <button type="button" className="link-button" onClick={() => onChange(null)}>
          Remove
        </button>
      </p>
    );
  }
  return (
    <details className="quick-book-late">
      <summary>Late entry: a time outside opening hours or on a closed day</summary>
      <label>
        Time
        <TextInput
          className="input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      <label>
        Reason (needed)
        <TextInput
          className="input"
          value={reason}
          maxLength={200}
          placeholder="For example: emergency, doctor agreed"
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn"
        disabled={!ready}
        onClick={() =>
          start !== null &&
          onChange({ startMin: start, endMin: start + minutes, reason: reason.trim() })
        }
      >
        Use this time
      </button>
      {!ready ? <p className="small muted">Enter a time and a short reason.</p> : null}
    </details>
  );
}
