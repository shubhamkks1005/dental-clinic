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
  type BoardMessage,
  type MessagesBoard,
} from "./api";
import { PatientCard, type MessageActions } from "./MessageCard";
import { groupByPatient, tabCount, type MessageTab } from "./message-groups";
import "./messages.css";

const TABS: { key: MessageTab; label: string }[] = [
  { key: "send", label: "To send" },
  { key: "opened", label: "Opened" },
  { key: "old", label: "Out of date" },
  { key: "attention", label: "Needs attention" },
];

/** Messages.dc.html / PhoneMessages.dc.html: grouped by patient, one chip row for the buckets. */
export function MessagesScreen() {
  const toast = useToast();
  const [board, setBoard] = useState<MessagesBoard | null>(null);
  const [mode, setMode] = useState("dry_run");
  const [draftBanner, setDraftBanner] = useState("DRAFT - doctor to confirm");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<MessageTab>("send");

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

  async function run(row: BoardMessage, work: () => Promise<string | void>) {
    setBusyId(row.id);
    try {
      const text = await work();
      if (text) toast({ text, tone: "ok" });
      await load();
    } catch (err) {
      toast({ text: problemText(err), tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const actions: MessageActions = {
    busyId,
    onOpen: (row) =>
      void run(row, async () => {
        const { waUrl } = await openWhatsApp(row.id);
        window.open(waUrl, "_blank", "noopener,noreferrer");
        return "WhatsApp opened. Tap Send there, then mark Sent here.";
      }),
    onDone: (row) =>
      void run(row, async () => {
        await markDoneManual(row.id);
        return "Marked as sent on WhatsApp.";
      }),
    onCancel: (row) =>
      void run(row, async () => {
        await cancelMessage(row.id);
        return "Message cancelled.";
      }),
  };

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

  const groups = board ? groupByPatient(board, tab) : [];
  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>Messages</h1>
        <p className="muted">
          Reminders and recalls. Messages never contain treatment details.{" "}
          <span className="chip">{draftBanner}</span>
        </p>
      </header>

      {mode === "dry_run" && (
        <p className="notice warning messages-test-bar" role="status">
          <strong>Test mode is ON.</strong> Nothing is sent by SMS. Tap Open WhatsApp to send each
          message by hand.
        </p>
      )}
      {error && <p className="notice error">{error}</p>}

      <div className="messages-toolbar">
        <div className="msg-tabs" role="group" aria-label="Show">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pill${tab === t.key ? " pill-on" : ""}`}
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label} {board ? tabCount(board, t.key) : ""}
            </button>
          ))}
        </div>
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
        <div className="messages-layout">
          <section aria-label={TABS.find((t) => t.key === tab)?.label}>
            {groups.length === 0 ? (
              <p className="muted">Nothing here.</p>
            ) : (
              <ul className="msg-patients">
                {groups.map((g) => (
                  <PatientCard
                    key={`${g.patientId}-${g.booking?.dateLocal}-${g.booking?.startMin}`}
                    group={g}
                    actions={actions}
                  />
                ))}
              </ul>
            )}
          </section>
          <aside className="messages-side">
            <section className="card" aria-label="Today">
              <p className="field-label">Today</p>
              <dl className="msg-counts">
                <div>
                  <dt>To send</dt>
                  <dd>{tabCount(board, "send")}</dd>
                </div>
                <div>
                  <dt>Opened in WhatsApp</dt>
                  <dd>{tabCount(board, "opened")}</dd>
                </div>
                <div>
                  <dt>Out of date</dt>
                  <dd>{tabCount(board, "old")}</dd>
                </div>
              </dl>
            </section>
            {board.noNumber.length > 0 ? (
              <section className="card" aria-label="No number">
                <p className="field-label">No number</p>
                {board.noNumber.map((p) => (
                  <p key={p.patientId}>
                    <strong>{p.patientName}</strong>
                    <br />
                    <span className="muted small">
                      Has no mobile. Tell the patient in person at the visit.
                    </span>
                  </p>
                ))}
              </section>
            ) : null}
            <section className="card" aria-label="When messages are created">
              <p className="field-label">When messages are created</p>
              <p className="muted small">
                Confirmation: when you book.
                <br />
                Reminder: 5:00 pm the day before.
                <br />
                Never for past appointments or patients without consent.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
