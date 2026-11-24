import { estimateTabletCount, FREQUENCY_PRESETS } from "@clinic/shared";
import type { DraftLine } from "./rx-lines";
import { Select, TextInput } from "../../ui/form";

type Props = {
  lines: DraftLine[];
  locked: boolean;
  busy: boolean;
  onChange: (next: DraftLine[]) => void;
  /** Save the lines (blur or select change). */
  onSave: (next: DraftLine[]) => void;
};

/** The medicine lines of one prescription: dose, frequency and days stay editable until issue. */
export function RxLinesTable({ lines, locked, busy, onChange, onSave }: Props) {
  const edit = (index: number, patch: Partial<DraftLine>) =>
    lines.map((l, i) => (i === index ? { ...l, ...patch } : l));

  return (
    <div className="rx-table-wrap">
      <table className="rx-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dose</th>
            <th>Freq</th>
            <th>Days</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.key}>
              <td data-label="Medicine">
                <strong>{line.genericName}</strong>
                <div className="muted small">
                  {line.strength} · {line.form}
                </div>
              </td>
              <td data-label="Dose">
                <TextInput
                  aria-label={`Dose for ${line.genericName}`}
                  value={line.dose}
                  disabled={locked || busy}
                  onChange={(e) => onChange(edit(index, { dose: e.target.value }))}
                  onBlur={() => onSave(lines)}
                />
              </td>
              <td data-label="Freq">
                <Select
                  aria-label={`Frequency for ${line.genericName}`}
                  value={line.frequency}
                  disabled={locked || busy}
                  onChange={(e) => {
                    const next = edit(index, { frequency: e.target.value });
                    onChange(next);
                    onSave(next);
                  }}
                >
                  {FREQUENCY_PRESETS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                  {!FREQUENCY_PRESETS.includes(
                    line.frequency as (typeof FREQUENCY_PRESETS)[number],
                  ) && <option value={line.frequency}>{line.frequency}</option>}
                </Select>
              </td>
              <td data-label="Days">
                <TextInput
                  aria-label={`Days for ${line.genericName}`}
                  value={line.days}
                  disabled={locked || busy}
                  inputMode="numeric"
                  onChange={(e) => onChange(edit(index, { days: e.target.value }))}
                  onBlur={() => onSave(lines)}
                />
              </td>
              <td data-label="Total" className="muted">
                {estimateTabletCount(line.dose, line.frequency, line.days) ?? "—"}
              </td>
              <td>
                {!locked && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => onSave(lines.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length === 0 && (
        <p className="muted">No medicines yet. Search and press Enter to add.</p>
      )}
    </div>
  );
}
