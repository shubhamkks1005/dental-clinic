import { Textarea } from "../../ui/form";
type Props = {
  label: string;
  value: string;
  rows?: number;
  readOnly: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
};

/** One labelled note box. */
export function VisitNoteField({ label, value, rows = 3, readOnly, placeholder, onChange }: Props) {
  return (
    <label className="visit-field">
      <span>{label}</span>
      <Textarea
        className="input"
        rows={rows}
        value={value}
        disabled={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
