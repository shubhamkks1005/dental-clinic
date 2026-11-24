import type { NotesSnapshot } from "./visit-autosave";
import { TextInput, Textarea } from "../../ui/form";

type Props = {
  form: NotesSnapshot;
  readOnly: boolean;
  setField: (key: keyof NotesSnapshot, value: string) => void;
  setPhrase: (key: keyof NotesSnapshot, value: string) => void;
};

/** The notes used less often: history, gums, vitals and the free next-visit note. */
export function VisitMoreNotes({ form, readOnly, setField, setPhrase }: Props) {
  return (
    <details className="v1-more">
      <summary>More: history, gums, vitals</summary>
      <div className="v1-more-body">
        <label className="visit-field">
          <span>History</span>
          <Textarea
            className="input"
            rows={2}
            value={form.historyNote}
            disabled={readOnly}
            placeholder="Type ;scal or ;review for a quick phrase"
            onChange={(e) => setPhrase("historyNote", e.target.value)}
          />
        </label>
        <label className="visit-field">
          <span>Gums</span>
          <TextInput
            className="input"
            value={form.gumCondition}
            disabled={readOnly}
            onChange={(e) => setField("gumCondition", e.target.value)}
          />
        </label>
        <label className="visit-field">
          <span>Next visit note</span>
          <TextInput
            className="input"
            value={form.nextVisitNote}
            disabled={readOnly}
            onChange={(e) => setPhrase("nextVisitNote", e.target.value)}
          />
        </label>
        <fieldset className="visit-vitals" disabled={readOnly}>
          <legend>Vitals (optional)</legend>
          {(
            [
              ["bpSystolic", "BP systolic"],
              ["bpDiastolic", "BP diastolic"],
              ["pulse", "Pulse"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="visit-field">
              <span>{label}</span>
              <TextInput
                className="input"
                inputMode="numeric"
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            </label>
          ))}
        </fieldset>
      </div>
    </details>
  );
}
