import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Textarea } from "../../ui/form";
import { entryText, historyDate, oneLineHistory, toothName } from "./tooth-model";
import { useToothHistory } from "./useToothHistory";

type Props = {
  patientId: string;
  visitId: string;
  tooth: number;
  readOnly: boolean;
  /** Turns a chart condition code into the word of the conditions list. */
  conditionLabel: (code: string) => string;
  /** Changes when this visit saved a mark, line or file: the card reads the tooth again. */
  refreshKey: number;
  onClose: () => void;
  onSelectTooth: (fdi: number) => void;
};

/** The tooth card (design: renderZoomedCard): who, history in one line, timeline, boxes, note. */
export function ToothCard({
  patientId,
  visitId,
  tooth,
  readOnly,
  conditionLabel,
  refreshKey,
  onClose,
  onSelectTooth,
}: Props) {
  const h = useToothHistory(patientId, visitId, tooth);
  const first = useRef(true);
  const { refresh } = h;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    refresh();
    // Only a new save asks for a fresh read.
  }, [refreshKey]);

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const note = h.data?.note ?? null;
  useEffect(() => {
    setEditing(false);
    setText(note?.body ?? "");
  }, [tooth, note?.body]);

  const diagProc = h.entries.filter((e) => e.kind === "diagnosis" || e.kind === "procedure");
  const files = h.entries.filter((e) => e.kind === "file");

  async function save() {
    if (await h.saveNote(text)) setEditing(false);
  }

  return (
    <section className="vd-tooth-card" aria-label={`Tooth ${tooth}`}>
      <div className="vd-tc-head">
        <div className="vd-tc-id">
          <div className="vd-tc-title">
            <strong>
              {tooth} · {toothName(tooth)}
            </strong>
            {h.data?.permanentTooth && (
              <button
                type="button"
                className="vd-chip"
                onClick={() => onSelectTooth(h.data?.permanentTooth as number)}
              >
                Permanent tooth {h.data.permanentTooth}
              </button>
            )}
          </div>
          <p className="vd-tc-line">
            History: {h.loading ? "Loading…" : oneLineHistory(h.entries, conditionLabel)}
          </p>
        </div>
        <button type="button" className="vd-small-btn" onClick={onClose}>
          Close
        </button>
      </div>

      {h.error && (
        <p className="vd-error" role="alert">
          {h.error}
        </p>
      )}

      <div className="vd-tc-block">
        <span className="vd-tc-label">Tooth timeline</span>
        {h.loading ? (
          <div className="vd-skel" style={{ width: 240 }} />
        ) : h.entries.length === 0 ? (
          <p className="vd-hint">No prior treatment recorded on this tooth.</p>
        ) : (
          <ul className="vd-timeline">
            {h.entries.map((e) => (
              <li key={`${e.kind}-${e.id}`}>
                <span className="vd-tl-date">{e.isToday ? "Today" : historyDate(e.at)}</span>
                <span>{entryText(e, conditionLabel)}</span>
                {e.fromTooth && <span className="vd-tag">Baby tooth {e.fromTooth}</span>}
              </li>
            ))}
          </ul>
        )}
        {h.data?.next && (
          <button type="button" className="vd-small-btn" disabled={h.older} onClick={h.showOlder}>
            {h.older ? "Loading…" : "Show older"}
          </button>
        )}
      </div>

      <div className="vd-tc-boxes">
        <div className="vd-tc-box">
          <span className="vd-tc-label">Diagnosis &amp; Procedures</span>
          {diagProc.length === 0 ? (
            <span className="vd-hint">None yet.</span>
          ) : (
            diagProc.slice(0, 5).map((e) => <span key={e.id}>{entryText(e, conditionLabel)}</span>)
          )}
        </div>
        <div className="vd-tc-box">
          <span className="vd-tc-label">Files (X-ray / Photo)</span>
          {files.length === 0 ? (
            <span className="vd-hint">No files.</span>
          ) : (
            files.slice(0, 5).map((e) => <span key={e.id}>{e.title}</span>)
          )}
        </div>
        <div className="vd-tc-box">
          <span className="vd-tc-label">Treatment plan</span>
          {(h.data?.plan ?? []).length === 0 ? (
            <span className="vd-hint">Nothing planned.</span>
          ) : (
            h.data?.plan.map((p) => (
              <span key={p.id}>
                {p.procedureLabel} · {p.status.replace("_", " ")}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="vd-tc-block">
        <div className="vd-tc-notehead">
          <span className="vd-tc-label">Tooth Clinical Note</span>
          {!editing && !readOnly && note && (
            <button type="button" className="vd-small-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
        {!editing && note ? (
          <p className="vd-tc-note">{note.body}</p>
        ) : readOnly ? (
          <p className="vd-hint">No note.</p>
        ) : (
          <>
            <Textarea
              className="vd-note-area"
              rows={2}
              maxLength={1000}
              placeholder="Write clinical note for this tooth..."
              aria-label={`Clinical note for tooth ${tooth}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {h.noteError && (
              <p className="vd-error" role="alert">
                {h.noteError}
              </p>
            )}
            <div className="vd-tc-actions">
              {note && (
                <button
                  type="button"
                  className="vd-small-btn"
                  onClick={() => {
                    setText(note.body);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="vd-primary-btn"
                disabled={h.noteBusy}
                onClick={() => void save()}
              >
                {h.noteBusy ? "Saving…" : "Save note"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="vd-tc-actions">
        <Link className="vd-small-btn" to={`/app/patients/${patientId}?tab=files`}>
          Add file
        </Link>
        <Link className="vd-small-btn is-on" to={`/app/patients/${patientId}?tab=plan`}>
          Add to plan
        </Link>
      </div>
    </section>
  );
}
