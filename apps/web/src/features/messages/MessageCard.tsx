import { formatClockTime, formatDate } from "@clinic/shared";
import { PatientNoChip } from "../../ui/PatientNoChip";
import type { BoardMessage } from "./api";
import { KIND_WORD, type PatientGroup } from "./message-groups";

const SKIP_WORDS: Record<string, string> = {
  out_of_date: "Withdrawn: the appointment changed",
  no_number: "No mobile number",
  no_sms_reminders_consent: "No consent for reminders",
};

export function dueText(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export type MessageActions = {
  busyId: string | null;
  onOpen: (r: BoardMessage) => void;
  onDone: (r: BoardMessage) => void;
  onCancel: (r: BoardMessage) => void;
};

const SENDABLE = ["needs_human", "queued", "held", "failed", "expired"];

function Item({
  row,
  actions,
  mode,
}: {
  row: BoardMessage;
  actions: MessageActions;
  mode: "now" | "later" | "old";
}) {
  const busy = actions.busyId === row.id;
  const word = KIND_WORD[row.kind] ?? row.kind;
  return (
    <li className={`msg-item${mode === "now" ? "" : " msg-item-dim"}`}>
      <div className="msg-item-head">
        <span className="chip">{word}</span>
        {mode === "later" ? (
          <span className="muted small">due {dueText(row.sendAfter)}</span>
        ) : null}
        {mode === "now" && row.status !== "needs_human" && row.status !== "queued" ? (
          <span className="muted small">{row.status.replaceAll("_", " ")}</span>
        ) : null}
        {row.skipReason ? (
          <span className="muted small">{SKIP_WORDS[row.skipReason] ?? row.skipReason}</span>
        ) : null}
      </div>
      <p className="msg-body">{row.body || "(no text)"}</p>
      <div className="msg-actions">
        {mode === "now" && SENDABLE.includes(row.status) ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => actions.onOpen(row)}
          >
            Open WhatsApp
          </button>
        ) : null}
        {mode === "now" && (row.status === "opened_in_whatsapp" || row.status === "needs_human") ? (
          <button type="button" className="btn" disabled={busy} onClick={() => actions.onDone(row)}>
            Mark sent
          </button>
        ) : null}
        {mode === "later" ? (
          <button type="button" className="btn" disabled>
            Not due yet
          </button>
        ) : null}
        {mode !== "old" && ["queued", "held", "needs_human"].includes(row.status) ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => actions.onCancel(row)}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** One patient: who, the booking, who the message goes to, then their messages. */
export function PatientCard({ group, actions }: { group: PatientGroup; actions: MessageActions }) {
  const b = group.booking;
  return (
    <li className="card msg-patient">
      <div className="msg-patient-head">
        <strong>{group.patientName}</strong> <PatientNoChip patientNo={group.patientCode} />
        <p className="muted small">
          {b ? `${formatDate(b.dateLocal)} · ${formatClockTime(b.startMin)}` : "No booking"}
          {group.sentTo ? (
            <>
              {" · to "}
              <strong>{group.sentTo}</strong>
            </>
          ) : null}
        </p>
      </div>
      <ul className="msg-items">
        {group.rows.map((r) => (
          <Item key={r.id} row={r} actions={actions} mode="now" />
        ))}
        {group.later.map((r) => (
          <Item key={r.id} row={r} actions={actions} mode="later" />
        ))}
        {group.withdrawn.map((r) => (
          <Item key={r.id} row={r} actions={actions} mode="old" />
        ))}
      </ul>
    </li>
  );
}
