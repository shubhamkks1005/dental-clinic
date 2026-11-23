import { expandQuickPhrase, type ListItem } from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import type { VisitSummary } from "./api";
import { CopyButton } from "../../ui/CopyButton";
import { SaveStatusChip } from "./SaveStatusChip";
import { useVisitAutosave } from "./useVisitAutosave";
import { notesAsText, type NotesSnapshot } from "./visit-autosave";

type Props = {
  visit: VisitSummary;
  phrases: ListItem[];
  readOnly: boolean;
  onSaved: (visit: VisitSummary) => void;
};

function fromVisit(v: VisitSummary): NotesSnapshot {
  return {
    chiefComplaint: v.chiefComplaint ?? "",
    historyNote: v.historyNote ?? "",
    examNote: v.examNote ?? "",
    gumCondition: v.gumCondition ?? "",
    advice: v.advice ?? "",
    nextVisitNote: v.nextVisitNote ?? "",
    bpSystolic: v.bpSystolic?.toString() ?? "",
    bpDiastolic: v.bpDiastolic?.toString() ?? "",
    pulse: v.pulse?.toString() ?? "",
  };
}

/** 3.5.3 + 3.5.5: notes form with quick phrases and autosave. */
export function VisitNotesForm({ visit, phrases, readOnly, onSaved }: Props) {
  const [form, setForm] = useState(() => fromVisit(visit));
  const [saved, setSaved] = useState(() => fromVisit(visit));
  const [version, setVersion] = useState(visit.version);

  useEffect(() => {
    const snap = fromVisit(visit);
    setForm(snap);
    setSaved(snap);
    setVersion(visit.version);
  }, [visit.id]);

  const phraseMap = useMemo(
    () =>
      phrases
        .filter((p) => p.active)
        .map((p) => ({
          trigger: p.label,
          text: String(p.data.text ?? ""),
        }))
        .filter((p) => p.text),
    [phrases],
  );

  const { status, dirty } = useVisitAutosave({
    visitId: visit.id,
    version,
    form,
    saved,
    enabled: !readOnly,
    onVersion: setVersion,
    onSaved: (next, snapshot) => {
      setSaved(snapshot);
      onSaved(next);
    },
  });

  function onPhraseField(key: keyof NotesSnapshot, raw: string) {
    const { value } = expandQuickPhrase(raw, phraseMap);
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="visit-notes"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      {!readOnly && <UnsavedChangesGuard dirty={dirty} />}
      <div className="visit-notes-actions">
        {!readOnly ? <SaveStatusChip status={status} /> : null}
      </div>
      {status === "conflict" ? (
        <div className="notice notice-error stack gap-sm" role="alert">
          <p>
            This visit was changed in another tab or by someone else. Your text is kept below. Copy
            it, reload the visit, then add what is missing.
          </p>
          <div className="row wrap gap-sm">
            <CopyButton text={notesAsText(form)} label="Copy my text" />
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload visit
            </button>
          </div>
        </div>
      ) : null}
      <label className="visit-field">
        <span>Chief complaint</span>
        <textarea
          className="input"
          rows={2}
          value={form.chiefComplaint}
          onChange={(e) => onPhraseField("chiefComplaint", e.target.value)}
          disabled={readOnly}
        />
      </label>
      <label className="visit-field">
        <span>History</span>
        <textarea
          className="input"
          rows={2}
          value={form.historyNote}
          onChange={(e) => onPhraseField("historyNote", e.target.value)}
          disabled={readOnly}
          placeholder="Type ;scal or ;review for a quick phrase"
        />
      </label>
      <label className="visit-field">
        <span>Exam</span>
        <textarea
          className="input"
          rows={2}
          value={form.examNote}
          onChange={(e) => onPhraseField("examNote", e.target.value)}
          disabled={readOnly}
        />
      </label>
      <label className="visit-field">
        <span>Gums</span>
        <input
          className="input"
          value={form.gumCondition}
          onChange={(e) => setForm((f) => ({ ...f, gumCondition: e.target.value }))}
          disabled={readOnly}
        />
      </label>
      <label className="visit-field">
        <span>Advice</span>
        <textarea
          className="input"
          rows={2}
          value={form.advice}
          onChange={(e) => onPhraseField("advice", e.target.value)}
          disabled={readOnly}
        />
      </label>
      <label className="visit-field">
        <span>Next visit note</span>
        <input
          className="input"
          value={form.nextVisitNote}
          onChange={(e) => onPhraseField("nextVisitNote", e.target.value)}
          disabled={readOnly}
        />
      </label>
      <fieldset className="visit-vitals" disabled={readOnly}>
        <legend>Vitals (optional)</legend>
        <label className="visit-field">
          <span>BP systolic</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.bpSystolic}
            onChange={(e) => setForm((f) => ({ ...f, bpSystolic: e.target.value }))}
          />
        </label>
        <label className="visit-field">
          <span>BP diastolic</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.bpDiastolic}
            onChange={(e) => setForm((f) => ({ ...f, bpDiastolic: e.target.value }))}
          />
        </label>
        <label className="visit-field">
          <span>Pulse</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.pulse}
            onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))}
          />
        </label>
      </fieldset>
    </form>
  );
}
