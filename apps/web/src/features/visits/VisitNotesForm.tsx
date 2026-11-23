import type { ListItem } from "@clinic/shared";
import { UnsavedChangesGuard } from "../../ui/UnsavedChangesGuard";
import type { VisitSummary } from "./api";
import { SaveStatusChip } from "./SaveStatusChip";
import { useVisitNotes } from "./useVisitNotes";
import { VisitConflictBanner } from "./VisitConflictBanner";

type Props = {
  visit: VisitSummary;
  phrases: ListItem[];
  readOnly: boolean;
  onSaved: (visit: VisitSummary) => void;
};

/** 3.5.3 + 3.5.5: notes form with quick phrases and autosave (old tabbed layout). */
export function VisitNotesForm({ visit, phrases, readOnly, onSaved }: Props) {
  const { form, status, dirty, setField, setPhrase } = useVisitNotes({
    visit,
    phrases,
    readOnly,
    onSaved,
  });
  const onPhraseField = setPhrase;
  const setForm = (fn: (f: typeof form) => typeof form) => {
    const next = fn(form);
    for (const key of Object.keys(next) as Array<keyof typeof form>) {
      if (next[key] !== form[key]) setField(key, next[key]);
    }
  };

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
      {status === "conflict" ? <VisitConflictBanner form={form} /> : null}
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
