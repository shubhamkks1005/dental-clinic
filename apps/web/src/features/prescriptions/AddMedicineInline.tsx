import type { ListItem } from "@clinic/shared";
import { useState } from "react";
import { problemText } from "../../api/problem-text";
import { Select, TextInput } from "../../ui/form";
import { scopeKey } from "../../ui/request-scope";
import { useRequestScope } from "../../ui/RequestScope";
import { addItemWithReply, MEDICINE_FORMS, newMedicineInput } from "../lists";

type Props = {
  /** What the doctor typed in the search box. */
  name: string;
  onAdded: (item: ListItem) => void;
  onCancel: () => void;
};

/**
 * "+ Add 'ibuprofen 400' to my list" (Q2.13): name, strength and form are enough here. The dose,
 * frequency, days and timing of a new medicine read "As directed" until the doctor writes them on
 * the line (they stay editable per prescription). DRAFT wording, see DECISIONS.md.
 */
export function AddMedicineInline({ name, onAdded, onCancel }: Props) {
  const scope = useRequestScope();
  const [label, setLabel] = useState(name.trim());
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState("Tablet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const reply = await addItemWithReply(
        "medicines",
        newMedicineInput({ label, strength, form, reviewed: false }),
      );
      // The screen's shared medicine list is old now; the next load() must ask the server.
      scope.forget(scopeKey.list("medicines"));
      // The reply names the new item by id: two medicines may share a name (L5).
      const added = reply.item;
      if (added) onAdded(added);
    } catch (err) {
      setError(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rx-add-inline card" role="group" aria-label="Add to my list">
      <label>
        Medicine name
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} autoComplete="off" />
      </label>
      <label>
        Strength
        <TextInput
          value={strength}
          onChange={(e) => setStrength(e.target.value)}
          placeholder="400 mg"
          autoComplete="off"
        />
      </label>
      <label>
        Form
        <Select value={form} onChange={(e) => setForm(e.target.value)}>
          {MEDICINE_FORMS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </Select>
      </label>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="rx-add-inline-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !label.trim() || !strength.trim()}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Add to my list and use it"}
        </button>
      </div>
      {!strength.trim() ? <p className="small muted">Type the strength to add it.</p> : null}
    </div>
  );
}
