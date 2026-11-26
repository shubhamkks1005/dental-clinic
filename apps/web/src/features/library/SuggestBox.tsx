import { suggest, type SuggestionField } from "@clinic/shared";
import { useId, useState, type KeyboardEvent } from "react";
import { TextInput } from "../../ui/form";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Bundled suggestions for this list; null = none (fees are never suggested). */
  field: SuggestionField | null;
  placeholder?: string;
  autoFocus?: boolean;
};

// Q4: suggestions show only while the typed text matches (never on focus with nothing typed),
// up to 8 rows, arrow keys + Enter, Esc and Tab close; picking fills the NAME only.
export function SuggestBox({ label, value, onChange, field, placeholder, autoFocus }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = field && open ? suggest(field, value).filter((s) => s !== value) : [];
  const shown = matches.length > 0;

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!shown) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + matches.length) % matches.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(matches[active]!);
    } else if (e.key === "Escape") {
      // Close the list only; the modal stays open.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <label className="ld-field">
      <span>{label}</span>
      <TextInput
        className="ld-input"
        value={value}
        aria-required="true"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKey}
        onBlur={() => setOpen(false)}
      />
      {shown ? (
        <ul id={listId} className="ld-suggest" role="listbox" aria-label={`${label} suggestions`}>
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
            >
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
