import { formatDate } from "@clinic/shared";

type Props = {
  days: string[];
  selected: string;
  onPick: (day: string) => void;
  label: string;
};

// A row of day buttons ("Tue 24"): the phone calendar's week strip and the Book dialog's date strip.
export function DateStrip({ days, selected, onPick, label }: Props) {
  return (
    <div className="date-strip" role="group" aria-label={label}>
      {days.map((day) => {
        const [dow, n] = formatDate(day).split(" ");
        const on = day === selected;
        return (
          <button
            key={day}
            type="button"
            className={`date-strip-day${on ? " date-strip-on" : ""}`}
            aria-pressed={on}
            aria-label={formatDate(day)}
            onClick={() => onPick(day)}
          >
            <span className="small">{dow}</span>
            <strong>{n}</strong>
          </button>
        );
      })}
    </div>
  );
}
