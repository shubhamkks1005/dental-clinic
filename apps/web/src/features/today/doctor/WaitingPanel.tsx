import { NativeInput } from "../../../ui/form";
import { useState } from "react";
import { Link } from "react-router";
import { icons } from "../../../ui/icons";
import { PatientNoChip } from "../../../ui/PatientNoChip";
import type { WaitingItem } from "./waiting-items";

export type Resolve = { kind: "yes" } | { kind: "no" } | { kind: "dismiss" };

type Props = {
  items: WaitingItem[];
  freshKeys: ReadonlySet<string>;
  minimized: boolean;
  animating: boolean;
  /** Ask the page to answer an item. Resolves when the server has it; rejects when it failed. */
  onResolve: (item: WaitingItem, how: Resolve, note: string) => Promise<void>;
  onMinimize: () => void;
};

const BADGE: Record<WaitingItem["tone"], string> = {
  error: "td-pill-error",
  warning: "td-pill-warning",
  info: "td-pill-info",
  neutral: "td-pill-neutral",
};

function Item({
  item,
  fresh,
  removing,
  onResolve,
}: {
  item: WaitingItem;
  fresh: boolean;
  removing: boolean;
  onResolve: (how: Resolve, note: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <li
      className={`td-item${removing ? " is-removing" : ""}${item.urgent ? " is-urgent" : ""}${fresh ? " is-new" : ""}`}
    >
      <div className="td-item-head">
        <span className="td-item-badges">
          <span className={`td-pill ${BADGE[item.tone]}`}>{item.badge}</span>
          {fresh ? <span className="td-pill td-pill-info">New</span> : null}
        </span>
        <span className="td-item-meta">
          <span>{item.meta}</span>
          {item.canDismiss ? (
            <button
              type="button"
              className="td-x"
              aria-label={`Dismiss ${item.badge.toLowerCase()} for ${item.who}`}
              title="Dismiss"
              onClick={() => onResolve({ kind: "dismiss" }, "")}
            >
              {icons.close}
            </button>
          ) : null}
        </span>
      </div>
      <div className="td-item-who">
        <span className="td-name">{item.who}</span>
        {item.patientCode ? <PatientNoChip patientNo={item.patientCode} /> : null}
      </div>
      <p className="td-item-line">{item.line}</p>
      {item.decision ? (
        <>
          <div className="td-item-actions">
            <button
              type="button"
              className="td-btn is-primary"
              onClick={() => onResolve({ kind: "yes" }, note)}
            >
              {item.decision.yes}
            </button>
            <button
              type="button"
              className="td-btn"
              onClick={() => onResolve({ kind: "no" }, note)}
            >
              {item.decision.no}
            </button>
            <button
              type="button"
              className={`td-btn td-note-btn${noteOpen ? " is-on" : ""}`}
              aria-expanded={noteOpen}
              onClick={() => setNoteOpen((o) => !o)}
            >
              <span aria-hidden="true">{icons.editNote}</span>
              Note
            </button>
          </div>
          <div className={`td-note-drawer${noteOpen ? " is-open" : ""}`}>
            <div className="td-note-row">
              <NativeInput
                type="text"
                className="td-note-input"
                aria-label={`Note for ${item.who}`}
                placeholder={item.decision.placeholder}
                value={note}
                maxLength={200}
                tabIndex={noteOpen ? 0 : -1}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                className={`td-btn is-primary td-submit${note.trim() ? " is-visible" : ""}`}
                tabIndex={note.trim() ? 0 : -1}
                onClick={() => onResolve({ kind: "no" }, note)}
              >
                Submit
              </button>
            </div>
          </div>
        </>
      ) : item.link ? (
        <Link className="td-btn td-link-btn" to={item.link.to}>
          {item.link.label}
        </Link>
      ) : null}
    </li>
  );
}

/** "Waiting for you" (design 6.4): the doctor's decisions in one place. */
export function WaitingPanel({
  items,
  freshKeys,
  minimized,
  animating,
  onResolve,
  onMinimize,
}: Props) {
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set());
  const left = items.filter((i) => !removing.has(i.key)).length;

  async function resolve(item: WaitingItem, how: Resolve, note: string) {
    setRemoving((s) => new Set(s).add(item.key));
    try {
      await onResolve(item, how, note);
    } catch {
      // The page showed the reason; the line slides back.
      setRemoving((s) => {
        const next = new Set(s);
        next.delete(item.key);
        return next;
      });
    }
  }

  return (
    <aside
      className={`td-panel td-card${minimized ? " is-minimized" : ""}${animating ? " is-animating" : ""}`}
      aria-label="Waiting for you"
      aria-hidden={minimized || undefined}
    >
      <div className="td-panel-inner">
        <header className="td-card-head">
          <div className="td-head-left">
            <h2>Waiting for you</h2>
            <span className="td-badge" aria-label={`${left} waiting`}>
              {left}
            </span>
          </div>
          <button
            type="button"
            className="td-btn td-icon-btn"
            title="Minimize Waiting for you"
            aria-label="Minimize Waiting for you"
            tabIndex={minimized ? -1 : 0}
            onClick={onMinimize}
          >
            {icons.panelClose}
          </button>
        </header>
        {left === 0 ? (
          <div className="td-empty">
            <span className="td-empty-icon" aria-hidden="true">
              {icons.taskDone}
            </span>
            <p className="td-empty-title">All caught up</p>
            <p className="td-empty-sub">New requests from the front desk will slide in here.</p>
          </div>
        ) : null}
        <ul className="td-items">
          {items.map((item) => (
            <Item
              key={item.key}
              item={item}
              fresh={freshKeys.has(item.key)}
              removing={removing.has(item.key)}
              onResolve={(how, note) => void resolve(item, how, note)}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}
