import { useId, type ReactNode } from "react";
import "./form.css";

// What a Field hands to its input: link to the label, the hint and the error message.
export type FieldInputProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid": boolean;
};

// 1.4.4: label above, input, optional hint, and the error right under the input (read out by
// screen readers through aria-describedby). Use: <Field ...>{(p) => <input {...p} ... />}</Field>
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (input: FieldInputProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-describedby": describedBy || undefined, "aria-invalid": !!error })}
      {hint && (
        <p id={hintId} className="small muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
