import type { ToothSurface } from "@clinic/shared";
import { useEffect, useState } from "react";
import { NativeInput } from "../../ui/form";
import { SURFACE_BUTTONS, TOOTH_HINT, parseToothText } from "./lines-model";
import type { UndoToast } from "./line-core";

/** Tooth box of one line: an FDI number or empty; a wrong number is refused with one sentence. */
export function ToothInput({
  value,
  disabled,
  label,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  label: string;
  onChange: (fdi: number | null) => void;
}) {
  const shown = value === null ? "" : String(value);
  const [text, setText] = useState(shown);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setText(shown);
    setBad(false);
  }, [shown]);

  function commit() {
    const r = parseToothText(text);
    if (!r.ok) {
      setBad(true);
      return;
    }
    setBad(false);
    if (r.fdi !== value) onChange(r.fdi);
  }

  return (
    <label className="vd-tooth">
      <span>Tooth</span>
      <NativeInput
        className={`vd-tooth-input${bad ? " is-bad" : ""}`}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="No tooth"
        aria-label={`Tooth number for ${label}`}
        aria-invalid={bad}
        title={TOOTH_HINT}
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      {bad && (
        <span role="alert" className="vd-hint">
          {TOOTH_HINT}
        </span>
      )}
    </label>
  );
}

/** O M D B L buttons. Always shown (owner decision Q6): leave all off for whole-tooth work. */
export function SurfaceButtons({
  value,
  disabled,
  onToggle,
}: {
  value: ToothSurface[];
  disabled: boolean;
  onToggle: (s: ToothSurface) => void;
}) {
  return (
    <div className="vd-surfaces" role="group" aria-label="Surfaces">
      {SURFACE_BUTTONS.map((s) => (
        <button
          key={s}
          type="button"
          className="vd-surface"
          aria-pressed={value.includes(s)}
          disabled={disabled}
          onClick={() => onToggle(s)}
        >
          {s.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** One step of Undo: shows for 6 seconds, then goes away. */
export function UndoBar({ undo, onUndo }: { undo: UndoToast | null; onUndo: () => void }) {
  if (!undo) return null;
  return (
    <div className="vd-toast" role="status">
      <span>{undo.text}</span>
      <button type="button" className="vd-primary-btn" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
