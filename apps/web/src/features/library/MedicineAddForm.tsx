import { useRef, useState } from "react";
import { Radio, TextInput } from "../../ui/form";
import { MEDICINE_FORMS, newMedicineInput } from "../lists";
import type { ListItemInput } from "@clinic/shared";

const MORE: { name: string; label: string; placeholder: string }[] = [
  { name: "brand", label: "Brand", placeholder: "optional" },
  { name: "default_dose", label: "Usual dose", placeholder: "1 tablet" },
  { name: "default_frequency", label: "How often", placeholder: "1-0-1" },
  { name: "default_days", label: "Days", placeholder: "3 days" },
  { name: "timing", label: "With food", placeholder: "after food" },
  { name: "instruction", label: "Instruction", placeholder: "optional" },
];

type Props = {
  /** Resolves true when saved. */
  onSave: (input: ListItemInput) => Promise<boolean>;
  onDone: () => void;
};

// LibraryAdd.dc.html: name, strength and form are all a new medicine needs.
export function MedicineAddForm({ onSave, onDone }: Props) {
  const [label, setLabel] = useState("");
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState<string>("Tablet");
  const [more, setMore] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const ready = label.trim() !== "" && strength.trim() !== "";

  async function save(again: boolean) {
    setBusy(true);
    const saved = await onSave(newMedicineInput({ label, strength, form, reviewed: true }, more));
    setBusy(false);
    if (!saved) return;
    if (!again) return onDone();
    setLabel("");
    setStrength("");
    setMore({});
    nameRef.current?.focus();
  }

  return (
    <form
      className="library-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) void save(false);
      }}
    >
      <label>
        Medicine name
        <TextInput
          ref={nameRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="generic name, for example Ibuprofen"
          autoComplete="off"
          maxLength={80}
        />
      </label>
      <label>
        Strength
        <TextInput
          value={strength}
          onChange={(e) => setStrength(e.target.value)}
          placeholder="400 mg"
          autoComplete="off"
          maxLength={40}
        />
      </label>
      <fieldset className="library-forms">
        <legend>Form</legend>
        {MEDICINE_FORMS.map((f) => (
          <label key={f} className={`pill${form === f ? " pill-on" : ""}`}>
            <Radio name="medicine-form" checked={form === f} onChange={() => setForm(f)} />
            {f}
          </label>
        ))}
      </fieldset>
      <details className="library-more-details">
        <summary>More details: brand, usual dose, days, timing, instruction</summary>
        {MORE.map((m) => (
          <label key={m.name}>
            {m.label}
            <TextInput
              value={more[m.name] ?? ""}
              placeholder={m.placeholder}
              autoComplete="off"
              onChange={(e) => setMore({ ...more, [m.name]: e.target.value })}
            />
          </label>
        ))}
        <p className="small muted">
          Left empty, dose, how often, days and timing read "As directed".
        </p>
      </details>
      <p className="small muted">
        Tip: you can also add a medicine while writing a prescription. You do not need to come here.
      </p>
      <div className="library-add-actions">
        <button type="submit" className="btn btn-primary" disabled={!ready || busy}>
          Save medicine
        </button>
        <button
          type="button"
          className="btn"
          disabled={!ready || busy}
          onClick={() => void save(true)}
        >
          Save and add another
        </button>
        <button type="button" className="btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
