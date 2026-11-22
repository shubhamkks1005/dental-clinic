import { expandQuickPhrase, type ListItem } from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { patchVisit, type VisitSummary } from "./api";

type Props = {
  visit: VisitSummary;
  phrases: ListItem[];
  readOnly: boolean;
  onSaved: (visit: VisitSummary) => void;
};

type FormState = {
  chiefComplaint: string;
  historyNote: string;
  examNote: string;
  gumCondition: string;
  advice: string;
  nextVisitNote: string;
  bpSystolic: string;
  bpDiastolic: string;
  pulse: string;
};

function fromVisit(v: VisitSummary): FormState {
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

function intOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 3.5.3: complaint / exam / advice / vitals with quick-phrase expansion. */
export function VisitNotesForm({ visit, phrases, readOnly, onSaved }: Props) {
  const [form, setForm] = useState(() => fromVisit(visit));
  const [version, setVersion] = useState(visit.version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setForm(fromVisit(visit));
    setVersion(visit.version);
  }, [visit]);

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

  function onPhraseField(key: keyof FormState, raw: string) {
    const { value } = expandQuickPhrase(raw, phraseMap);
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const saved = await patchVisit(visit.id, {
        version,
        chiefComplaint: form.chiefComplaint.trim() || null,
        historyNote: form.historyNote.trim() || null,
        examNote: form.examNote.trim() || null,
        gumCondition: form.gumCondition.trim() || null,
        advice: form.advice.trim() || null,
        nextVisitNote: form.nextVisitNote.trim() || null,
        bpSystolic: intOrNull(form.bpSystolic),
        bpDiastolic: intOrNull(form.bpDiastolic),
        pulse: intOrNull(form.pulse),
      });
      setVersion(saved.version);
      setSavedAt("Saved");
      onSaved(saved);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="visit-notes"
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) void save();
      }}
    >
      <label className="visit-field">
        <span>Chief complaint</span>
        <textarea
          className="input"
          rows={2}
          value={form.chiefComplaint}
          onChange={(e) => onPhraseField("chiefComplaint", e.target.value)}
          disabled={readOnly || busy}
        />
      </label>
      <label className="visit-field">
        <span>History</span>
        <textarea
          className="input"
          rows={2}
          value={form.historyNote}
          onChange={(e) => onPhraseField("historyNote", e.target.value)}
          disabled={readOnly || busy}
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
          disabled={readOnly || busy}
        />
      </label>
      <label className="visit-field">
        <span>Gums</span>
        <input
          className="input"
          value={form.gumCondition}
          onChange={(e) => setForm((f) => ({ ...f, gumCondition: e.target.value }))}
          disabled={readOnly || busy}
        />
      </label>
      <label className="visit-field">
        <span>Advice</span>
        <textarea
          className="input"
          rows={2}
          value={form.advice}
          onChange={(e) => onPhraseField("advice", e.target.value)}
          disabled={readOnly || busy}
        />
      </label>
      <label className="visit-field">
        <span>Next visit note</span>
        <input
          className="input"
          value={form.nextVisitNote}
          onChange={(e) => onPhraseField("nextVisitNote", e.target.value)}
          disabled={readOnly || busy}
        />
      </label>
      <fieldset className="visit-vitals" disabled={readOnly || busy}>
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
      {!readOnly && (
        <div className="visit-notes-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save notes"}
          </button>
          {savedAt ? <span className="muted small">{savedAt}</span> : null}
        </div>
      )}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
