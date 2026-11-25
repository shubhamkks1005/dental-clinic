import { useId, useRef, useState, type ReactNode } from "react";
import { icons } from "../../ui/icons";
import { NativeInput } from "../../ui/form";

export type SearchItem = { id: string; label: string; code?: string; note?: string };

type Props = {
  placeholder: string;
  disabled?: boolean;
  /** The rows for the text typed so far (the parent decides what matches). */
  items: (text: string) => SearchItem[];
  onPick: (item: SearchItem) => void;
  /** Enter with no row: the diagnosis box adds the text as free text. Procedures leave this out. */
  onEnterFreeText?: (text: string) => void;
  /** What shows when nothing matches. */
  empty: (text: string, done: () => void) => ReactNode;
  /** Shown above the rows when the box is empty and nothing was typed. */
  idleHint?: ReactNode;
};

/**
 * Search, then Enter (design: onDiagSearchKey / onProcSearchKey). The list shows when the box is
 * focused; arrows move, Enter takes the focused row, Escape closes. One shared piece for the
 * diagnosis and the procedure search.
 */
export function LineSearch({
  placeholder,
  disabled,
  items,
  onPick,
  onEnterFreeText,
  empty,
  idleHint,
}: Props) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const rows = items(text);
  const typed = text.trim();

  function pick(item: SearchItem) {
    onPick(item);
    setText("");
    setOpen(false);
    setActive(0);
  }
  const close = () => {
    setText("");
    setOpen(false);
  };

  function keys(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (rows.length > 0) {
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((a) => (a + step + rows.length) % rows.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[Math.min(active, rows.length - 1)];
      if (row) pick(row);
      else if (typed && onEnterFreeText) {
        onEnterFreeText(typed);
        close();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      className="vd-search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="vd-search-field">
        <span className="vd-search-icon" aria-hidden="true">
          {icons.search}
        </span>
        <NativeInput
          ref={input}
          className="vd-search-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={disabled}
          value={text}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={keys}
        />
      </div>
      {open && !disabled && (
        <div className="vd-menu" id={listId} role="listbox">
          {typed === "" && idleHint}
          {rows.length > 0
            ? rows.map((row, i) => (
                <button
                  key={row.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`vd-opt${i === active ? " is-active" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(row)}
                >
                  <span>
                    {row.label}
                    {row.code ? <span className="vd-opt-code">{row.code}</span> : null}
                  </span>
                  <span className="vd-opt-note">{row.note ?? (i === 0 ? "Enter" : "")}</span>
                </button>
              ))
            : empty(typed, close)}
        </div>
      )}
    </div>
  );
}
