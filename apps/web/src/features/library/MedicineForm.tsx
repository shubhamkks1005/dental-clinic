import { MEDICINE_FORM_WORD, MEDICINE_TIMING_LABEL } from "@clinic/shared";
import { useId, useState } from "react";
import { Checkbox, Select, TextInput } from "../../ui/form";
import type { Draft } from "./library-draft";
import { SuggestBox } from "./SuggestBox";

type Props = {
  draft: Draft;
  onDraft: (d: Draft) => void;
  categories: string[];
  autoFocus: boolean;
};

const FORM_WORDS = Object.values(MEDICINE_FORM_WORD);

// HTML 731-757 minus the dropped fields (Time of Day Q7, Storage). Only the name is required;
// empty dose, frequency, days and timing are saved as "As directed" by the server (Q8).
export function MedicineForm({ draft, onDraft, categories, autoFocus }: Props) {
  const [comboTouched, setComboTouched] = useState(draft.data.combination === "yes");
  const ids = { cat: useId(), form: useId() };
  const d = draft.data;
  const set = (patch: Record<string, string>) => onDraft({ ...draft, data: { ...d, ...patch } });
  const field = (name: string, label: string, placeholder?: string) => (
    <label className="ld-field">
      <span>{label}</span>
      <TextInput
        className="ld-input"
        value={d[name] ?? ""}
        placeholder={placeholder}
        onChange={(e) => set({ [name]: e.target.value })}
      />
    </label>
  );
  // An older stored timing (bedtime, anytime, free text) stays as an extra option (Q10).
  const timing = d.timing ?? "";
  const oldTiming = timing && timing !== "after_food" && timing !== "before_food" ? timing : "";

  return (
    <>
      <SuggestBox
        label="Medicine name"
        field="medicines"
        value={draft.label}
        autoFocus={autoFocus}
        placeholder="Type to see medicine suggestions..."
        onChange={(label) =>
          onDraft({
            label,
            data: comboTouched ? d : { ...d, combination: label.includes("+") ? "yes" : "" },
          })
        }
      />
      <div className="ld-grid-2">
        {field("salt", "Generic / Salt", "Enter salt")}
        {field("brand", "Brand Name", "Enter brand")}
      </div>
      <div className="ld-grid-3">
        <label className="ld-field">
          <span>Category</span>
          <TextInput
            className="ld-input"
            list={ids.cat}
            value={d.category ?? ""}
            onChange={(e) => set({ category: e.target.value })}
          />
          <datalist id={ids.cat}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="ld-field">
          <span>Form</span>
          <TextInput
            className="ld-input"
            list={ids.form}
            value={d.form ?? ""}
            placeholder="Tablet"
            onChange={(e) => set({ form: e.target.value })}
          />
          <datalist id={ids.form}>
            {FORM_WORDS.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </label>
        {field("strength", "Strength", "500 mg")}
      </div>
      <div className="ld-grid-2">
        {field("default_dose", "Usual Dose", "e.g. 1 tablet, 10 ml")}
        {field("default_frequency", "Frequency", "e.g. 2 times a day")}
      </div>
      <div className="ld-grid-2">
        <label className="ld-field">
          <span>Food Timing</span>
          <Select
            className="ld-input"
            value={timing}
            onChange={(e) => set({ timing: e.target.value })}
          >
            <option value="">As directed</option>
            <option value="after_food">{MEDICINE_TIMING_LABEL.after_food}</option>
            <option value="before_food">{MEDICINE_TIMING_LABEL.before_food}</option>
            {oldTiming ? (
              <option value={oldTiming}>
                {(MEDICINE_TIMING_LABEL as Record<string, string>)[oldTiming] ?? oldTiming}
              </option>
            ) : null}
          </Select>
        </label>
        {field("default_days", "Days (Duration)", "e.g. 5 days")}
      </div>
      <label className="ld-switch">
        <Checkbox
          role="switch"
          checked={d.combination === "yes"}
          onChange={(e) => {
            setComboTouched(true);
            set({ combination: e.target.checked ? "yes" : "" });
          }}
        />
        <span>Combination (two or more salts)</span>
      </label>
      <details className="ld-more-details">
        <summary>More details</summary>
        <div className="ld-grid-2">
          {field("instruction", "Instruction")}
          {field("tags", "Tags (for allergy checks)")}
        </div>
      </details>
    </>
  );
}
