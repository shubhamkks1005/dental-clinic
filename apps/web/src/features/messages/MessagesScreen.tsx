import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import {
  cancelMessage,
  dumpToWhatsApp,
  fetchMessagesBoard,
  fetchMessagingStatus,
  markDoneManual,
  openWhatsApp,
  type MessageRow,
  type MessagesBoard,
} from "./api";
import "./messages.css";

/** S11 Messages board — dry_run bar + WhatsApp queue (Phase 7). */
export function MessagesScreen() {
  const toast = useToast();
  const [board, setBoard] = useState<MessagesBoard | null>(null);
  const [mode, setMode] = useState("dry_run");
  const [draftBanner, setDraftBanner] = useState("DRAFT - doctor to confirm");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([fetchMessagesBoard(), fetchMessagingStatus()]);
      setBoard(b);
      setMode(s.mode);
      setDraftBanner(s.draftBanner);
      setError(null);
    } catch (err) {
      setError(problemText(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onOpenWhatsApp(row: MessageRow) {
    setBusyId(row.id);
    try {
      const { waUrl } = await openWhatsApp(row.id);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast({ text: "WhatsApp opened. Tap Send there, then mark Sent here.", tone: "ok" });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function onDone(row: MessageRow) {
    setBusyId(row.id);
    try {
      await markDoneManual(row.id);
      toast({ text: "Marked as sent on WhatsApp.", tone: "ok" });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function onCancel(row: MessageRow) {
    setBusyId(row.id);
    try {
      await cancelMessage(row.id);
      toast({ text: "Message cancelled.", tone: "ok" });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function onDump() {
    try {
      const { converted } = await dumpToWhatsApp();
      toast({
        text:
          converted === 0 ? "No queued SMS to move." : `Moved ${converted} queued SMS to WhatsApp.`,
        tone: "ok",
      });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    }
  }

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>Messages</h1>
        <p className="muted">{draftBanner}</p>
      </header>

      {mode === "dry_run" && (
        <p className="notice warning messages-test-bar" role="status">
          Test mode is ON. Nothing is sent by SMS. Use Open WhatsApp to send by hand.
        </p>
      )}

      {error && <p className="notice error">{error}</p>}

      <div className="messages-toolbar">
        <button type="button" className="btn" onClick={() => void load()}>
          Refresh
        </button>
        <button type="button" className="btn" onClick={() => void onDump()}>
          Move queued SMS to WhatsApp
        </button>
      </div>

      {!board ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="messages-columns">
          <Bucket
            title="Outgoing"
            rows={board.outgoing}
            busyId={busyId}
            onOpen={onOpenWhatsApp}
            onDone={onDone}
            onCancel={onCancel}
          />
          <Bucket
            title="Send on WhatsApp"
            rows={board.whatsapp}
            busyId={busyId}
            onOpen={onOpenWhatsApp}
            onDone={onDone}
            onCancel={onCancel}
          />
          <Bucket
            title="Sent / opened"
            rows={board.sentToday}
            busyId={busyId}
            onOpen={onOpenWhatsApp}
            onDone={onDone}
            onCancel={onCancel}
          />
          <Bucket
            title="Needs attention"
            rows={board.attention}
            busyId={busyId}
            onOpen={onOpenWhatsApp}
            onDone={onDone}
            onCancel={onCancel}
          />
        </div>
      )}
    </div>
  );
}

function Bucket(props: {
  title: string;
  rows: MessageRow[];
  busyId: string | null;
  onOpen: (r: MessageRow) => void;
  onDone: (r: MessageRow) => void;
  onCancel: (r: MessageRow) => void;
}) {
  return (
    <section className="messages-bucket" aria-label={props.title}>
      <h2>
        {props.title} <span className="muted">({props.rows.length})</span>
      </h2>
      {props.rows.length === 0 ? (
        <p className="muted">None.</p>
      ) : (
        <ul className="messages-list">
          {props.rows.map((row) => (
            <li key={row.id} className="messages-card">
              <p className="messages-meta">
                <strong>{row.kind}</strong> · {row.status}
                {row.skipReason ? ` · ${row.skipReason}` : ""}
              </p>
              <p className="messages-body">{row.body || "(no text)"}</p>
              <div className="messages-actions">
                {(row.status === "needs_human" ||
                  row.status === "queued" ||
                  row.status === "held" ||
                  row.status === "failed" ||
                  row.status === "expired") && (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={props.busyId === row.id}
                    onClick={() => props.onOpen(row)}
                  >
                    Open WhatsApp
                  </button>
                )}
                {(row.status === "opened_in_whatsapp" || row.status === "needs_human") && (
                  <button
                    type="button"
                    className="btn"
                    disabled={props.busyId === row.id}
                    onClick={() => props.onDone(row)}
                  >
                    Mark sent
                  </button>
                )}
                {["queued", "held", "needs_human"].includes(row.status) && (
                  <button
                    type="button"
                    className="btn"
                    disabled={props.busyId === row.id}
                    onClick={() => props.onCancel(row)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
