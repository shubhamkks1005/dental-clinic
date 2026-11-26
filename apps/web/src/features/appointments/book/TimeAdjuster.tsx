import { NativeInput } from "../../../ui/form";
import { CalIcon } from "../CalIcon";
import { rangeLabel } from "../cal-geometry";

const QUICK = [15, 30, 45, 60, 90];

// "Time & Duration Adjuster" (HTML 587-639): date, start time (any minute), length 5-240 in steps
// of 5 with quick pills; the active pill follows the number (HTML 1081-1093).
export function TimeAdjuster({
  dateLocal,
  time,
  startMin,
  minutes,
  onDate,
  onTime,
  onMinutes,
}: {
  dateLocal: string;
  time: string;
  startMin: number | null;
  minutes: number;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  onMinutes: (v: number) => void;
}) {
  const summary = startMin !== null && minutes > 0 ? rangeLabel(startMin, minutes) : "";
  return (
    <div className="bk-adjuster">
      <div className="bk-label-row">
        <span className="bk-label bk-label-icon">
          <CalIcon name="schedule" />
          <span>Time &amp; Duration Adjuster</span>
        </span>
        {summary ? (
          <span className="bk-range" data-testid="bk-range">
            {summary}
          </span>
        ) : null}
      </div>
      <div className="bk-adjust-grid">
        <label className="bk-mini">
          <span>Date</span>
          <NativeInput
            type="date"
            className="bk-input bk-input-sm"
            value={dateLocal}
            onChange={(e) => e.target.value && onDate(e.target.value)}
          />
        </label>
        <label className="bk-mini">
          <span>Start Time</span>
          <NativeInput
            type="time"
            step={300}
            className="bk-input bk-input-sm cal-mono"
            value={time}
            onChange={(e) => e.target.value && onTime(e.target.value)}
          />
        </label>
        <label className="bk-mini">
          <span className="bk-label-row">
            <span>Duration (Min)</span>
            <span className="bk-any">Any min</span>
          </span>
          <span className="bk-suffix-wrap">
            <NativeInput
              type="number"
              min={5}
              max={240}
              step={5}
              className="bk-input bk-input-sm cal-mono"
              aria-label="Duration in minutes"
              value={Number.isFinite(minutes) ? minutes : ""}
              onChange={(e) =>
                onMinutes(e.target.value === "" ? Number.NaN : Number(e.target.value))
              }
            />
            <span className="bk-suffix">min</span>
          </span>
        </label>
      </div>
      <div className="bk-label-row">
        <span className="bk-quick">
          <span className="bk-quick-label">Quick:</span>
          {QUICK.map((m) => (
            <button
              key={m}
              type="button"
              className={`bk-pill${m === minutes ? " is-on" : ""}`}
              aria-pressed={m === minutes}
              onClick={() => onMinutes(m)}
            >
              {m}m
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
