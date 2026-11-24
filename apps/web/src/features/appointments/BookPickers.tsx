import { addIstDays, formatClockTime, formatDate, type ListItem } from "@clinic/shared";
import { useState } from "react";
import type { SuggestedSlot } from "./api";

const TIME_CHIPS = 8;

export function VisitTypeChips({
  items,
  value,
  onPick,
  disabled,
}: {
  items: ListItem[];
  value: string;
  onPick: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="chip-row" role="group" aria-label="Visit type">
      {items.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`pill${v.id === value ? " pill-on" : ""}`}
          aria-pressed={v.id === value}
          disabled={disabled}
          onClick={() => onPick(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

const sameSlot = (a: SuggestedSlot | null, b: SuggestedSlot) =>
  a?.dateLocal === b.dateLocal && a.startMin === b.startMin;

/** Eight time chips, "More times" shows the rest of the day. */
export function TimeChips({
  slots,
  chosen,
  onPick,
}: {
  slots: SuggestedSlot[];
  chosen: SuggestedSlot | null;
  onPick: (s: SuggestedSlot) => void;
}) {
  const [all, setAll] = useState(false);
  // A time chosen from the calendar stays visible even past the eighth chip.
  const shown = all ? slots : slots.slice(0, TIME_CHIPS);
  const list =
    chosen && !shown.some((s) => sameSlot(chosen, s)) && slots.some((s) => sameSlot(chosen, s))
      ? [...shown, chosen]
      : shown;
  return (
    <>
      <ul className="time-chips">
        {list.map((s) => (
          <li key={s.startMin}>
            <button
              type="button"
              className={`pill${sameSlot(chosen, s) ? " pill-on" : ""}`}
              aria-pressed={sameSlot(chosen, s)}
              onClick={() => onPick(s)}
            >
              {formatClockTime(s.startMin)}
            </button>
          </li>
        ))}
      </ul>
      {slots.length > TIME_CHIPS ? (
        <button type="button" className="link-button" onClick={() => setAll((v) => !v)}>
          {all ? "Fewer times" : "More times"}
        </button>
      ) : null}
    </>
  );
}

/** "No free times on Tue 24 Nov. Try Wednesday." The hint names the next day that has a time. */
export function noFreeTimesText(dateLocal: string, next: SuggestedSlot[]): string {
  const later = next.find((s) => s.dateLocal > dateLocal)?.dateLocal ?? addIstDays(dateLocal, 1);
  const weekday = new Date(`${later}T12:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    timeZone: "UTC",
  });
  return `No free times on ${formatDate(dateLocal)}. Try ${weekday}.`;
}
