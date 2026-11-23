import { istDate, formatDate } from "@clinic/shared";

type Props = {
  value: string;
  readOnly: boolean;
  onChange: (text: string) => void;
};

const WEEKS = [2, 4, 6] as const;
const weeksText = (n: number) => `In ${n} weeks`;

/** Next visit as a short note ("In 4 weeks" or a date). It is text only; it books nothing. */
export function NextVisitChips({ value, readOnly, onChange }: Props) {
  const isDate = /^On \d{4}-\d{2}-\d{2}$/.test(value);
  return (
    <div className="v1-block" role="group" aria-label="Next visit">
      <h3 className="v1-label">Next visit</h3>
      <div className="v1-chips">
        {WEEKS.map((n) => (
          <button
            key={n}
            type="button"
            className={`v1-pill${value === weeksText(n) ? " is-on" : ""}`}
            aria-pressed={value === weeksText(n)}
            disabled={readOnly}
            onClick={() => onChange(value === weeksText(n) ? "" : weeksText(n))}
          >
            {weeksText(n)}
          </button>
        ))}
        <label className={`v1-pill v1-date${isDate ? " is-on" : ""}`}>
          <span>{isDate ? `On ${formatDate(value.slice(3))}` : "Pick date"}</span>
          <input
            type="date"
            aria-label="Pick a date for the next visit"
            min={istDate(new Date())}
            disabled={readOnly}
            value={isDate ? value.slice(3) : ""}
            onChange={(e) => onChange(e.target.value ? `On ${e.target.value}` : "")}
          />
        </label>
      </div>
      {value && !isDate && !WEEKS.some((n) => weeksText(n) === value) && (
        <p className="muted small">Note: {value}</p>
      )}
    </div>
  );
}
