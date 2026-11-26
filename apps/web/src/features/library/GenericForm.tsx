import {
  isSuggestionField,
  LIST_DEFS,
  VISIT_COLOURS,
  visitColourName,
  type ListField,
  type ListKey,
} from "@clinic/shared";
import { NativeInput, Select, TextInput, Textarea } from "../../ui/form";
import type { Draft } from "./library-draft";
import { SuggestBox } from "./SuggestBox";

type Props = { listKey: ListKey; draft: Draft; onDraft: (d: Draft) => void; autoFocus: boolean };

const MINUTES = Array.from({ length: 48 }, (_, i) => (i + 1) * 5);
const CAUTION: Partial<Record<ListKey, string>> = {
  allergens: "A wrong tag can miss an allergy warning.",
};

// Every list but medicines and sets: the fields come from LIST_DEFS (one place), with the
// design's own controls for fee (rupees), length (select), colour (named swatches, L19) and text.
export function GenericForm({ listKey, draft, onDraft, autoFocus }: Props) {
  const d = draft.data;
  const set = (name: string, value: string) => onDraft({ ...draft, data: { ...d, [name]: value } });
  const fields = (LIST_DEFS[listKey].fields as readonly ListField[]).filter(
    (f) => !(f.kind === "text" && f.hidden),
  );

  function control(f: ListField) {
    const value = d[f.name] ?? "";
    if (listKey === "procedures" && f.name === "default_paise")
      return (
        <label className="ld-field" key={f.name}>
          <span>Usual Fee</span>
          <span className="ld-prefix">
            <b aria-hidden="true">₹</b>
            <TextInput
              className="ld-input"
              inputMode="decimal"
              value={value}
              placeholder="1000"
              onChange={(e) => set(f.name, e.target.value)}
            />
          </span>
          <span className="ld-note">Edits never change past bills.</span>
        </label>
      );
    if (f.kind === "number")
      return (
        <label className="ld-field" key={f.name}>
          <span>{f.label}</span>
          <Select className="ld-input" value={value} onChange={(e) => set(f.name, e.target.value)}>
            {MINUTES.filter((m) => m >= f.min && m <= f.max).map((m) => (
              <option key={m} value={m}>
                {m} {f.suffix}
              </option>
            ))}
          </Select>
        </label>
      );
    if (f.kind === "colour") {
      const known = VISIT_COLOURS.some((c) => c.hex === value.toUpperCase());
      return (
        <fieldset className="ld-field" key={f.name}>
          <span>{f.label}</span>
          <div className="ld-swatches">
            {VISIT_COLOURS.map((c) => (
              <button
                key={c.hex}
                type="button"
                aria-pressed={value.toUpperCase() === c.hex}
                onClick={() => set(f.name, c.hex)}
              >
                <span className="ld-swatch" aria-hidden="true" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
            <label className="ld-swatches-custom">
              <NativeInput
                type="color"
                aria-label="Custom colour"
                value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#1E4FA3"}
                onChange={(e) => set(f.name, e.target.value.toUpperCase())}
              />
              {!known && value ? ` ${visitColourName(value)}` : null}
            </label>
          </div>
        </fieldset>
      );
    }
    if (f.name === "restricted")
      return (
        <label className="ld-field" key={f.name}>
          <span>Restricted</span>
          <Select className="ld-input" value={value} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">No</option>
            <option value="yes">Yes</option>
          </Select>
        </label>
      );
    if (f.name === "text")
      return (
        <label className="ld-field" key={f.name}>
          <span>{f.label}</span>
          <Textarea
            className="ld-input"
            value={value}
            onChange={(e) => set(f.name, e.target.value)}
          />
          <span className="ld-note" aria-live="polite">
            {value.length} / {f.max}
          </span>
        </label>
      );
    return (
      <label className="ld-field" key={f.name}>
        <span>
          {f.label}
          {f.optional ? " (optional)" : ""}
        </span>
        <TextInput
          className="ld-input"
          value={value}
          onChange={(e) => set(f.name, e.target.value)}
        />
      </label>
    );
  }

  return (
    <>
      <SuggestBox
        label="Name"
        field={isSuggestionField(listKey) ? listKey : null}
        value={draft.label}
        autoFocus={autoFocus}
        placeholder="Enter name"
        onChange={(label) => onDraft({ ...draft, label })}
      />
      {fields.map(control)}
      {CAUTION[listKey] ? <p className="ld-note">{CAUTION[listKey]}</p> : null}
    </>
  );
}
