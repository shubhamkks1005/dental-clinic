import { plural } from "@clinic/shared";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { TextInput } from "../../ui/form";
import { CalIcon } from "./CalIcon";
import { dayParts } from "./CalDayHead";

const LONG_WD: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/** "Wednesday, 25 Nov 2026" (popover date line, day summary). */
export function longDate(dateLocal: string): string {
  const { weekday, date } = dayParts(dateLocal);
  return `${LONG_WD[weekday]}, ${date} ${dateLocal.slice(0, 4)}`;
}

type Props = {
  week: boolean;
  first: string;
  last: string;
  booked: number | null;
  doctorView: boolean;
  date: string;
  canToggle: boolean;
  printHref: string;
  search: ReactNode;
  filter: ReactNode;
  onStep: (dir: -1 | 1) => void;
  onToday: () => void;
  onDate: (date: string) => void;
  onView: (view: "week" | "day") => void;
  onBook: () => void;
  /** Offline (P7.2.5): booking waits for the connection. */
  bookDisabled: boolean;
};

// Header strip (HTML 194-247). L9: no "1 chair (Room 1)".
export function CalHeader(p: Props) {
  const unit = p.week ? "week" : "day";
  const year = p.last.slice(0, 4);
  return (
    <header className="cal-head">
      <div className="cal-head-row">
        <div>
          <div className="cal-title-line">
            <h1 className="cal-title">Appointments Calendar</h1>
            <span className="cal-role-chip">{p.doctorView ? "Doctor View" : "Desk View"}</span>
          </div>
          <p className="cal-summary" data-testid="cal-summary">
            {p.week ? (
              <>
                Week:{" "}
                <span>
                  {dayParts(p.first).date} – {dayParts(p.last).date} {year}
                </span>
              </>
            ) : (
              <span>{longDate(p.first)}</span>
            )}
            {p.booked !== null ? (
              <>
                {" · "}
                <strong>
                  {p.week ? `${plural(p.booked, "appointment")} booked` : `${p.booked} booked`}
                </strong>
              </>
            ) : null}
          </p>
        </div>
        <div className="cal-controls">
          {p.search}
          <div className="cal-seg">
            <button
              type="button"
              title={`Previous ${unit}`}
              aria-label={`Previous ${unit}`}
              onClick={() => p.onStep(-1)}
            >
              <CalIcon name="chevron_left" />
            </button>
            <button type="button" className="cal-seg-today" onClick={p.onToday}>
              Today
            </button>
            <button
              type="button"
              title={`Next ${unit}`}
              aria-label={`Next ${unit}`}
              onClick={() => p.onStep(1)}
            >
              <CalIcon name="chevron_right" />
            </button>
          </div>
          <TextInput
            className="cal-date"
            type="date"
            aria-label="Date"
            value={p.date}
            onChange={(e) => {
              if (e.target.value) p.onDate(e.target.value);
            }}
          />
          {p.canToggle ? (
            <div className="cal-seg cal-view-seg" role="group" aria-label="Calendar view">
              <button type="button" aria-pressed={p.week} onClick={() => p.onView("week")}>
                Week
              </button>
              <button type="button" aria-pressed={!p.week} onClick={() => p.onView("day")}>
                Day
              </button>
            </div>
          ) : null}
          <Link className="cal-btn" to={p.printHref} target="_blank" rel="noreferrer">
            <CalIcon name="print" />
            <span>Print list</span>
          </Link>
          <button
            type="button"
            className="cal-btn cal-btn-primary"
            disabled={p.bookDisabled}
            title={p.bookDisabled ? "You are offline." : undefined}
            onClick={p.onBook}
          >
            <CalIcon name="add" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>
      {p.filter}
    </header>
  );
}
