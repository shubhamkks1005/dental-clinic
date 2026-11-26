import { doctorShortName } from "@clinic/shared";
import type { DayAppointmentsReply } from "./api";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayParts(dateLocal: string) {
  const [y, m, d] = dateLocal.split("-").map(Number) as [number, number, number];
  return { weekday: WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!, date: `${d} ${MON[m - 1]}` };
}

// Day head (HTML 257-295): weekday, date, "N booked"; today tinted with the TODAY tag; closed
// grey with "Closed"; a doctor on leave gets a line under the pill (P5.3.4).
export function CalDayHead({
  day,
  booked,
  today,
  leaves,
}: {
  day: DayAppointmentsReply;
  booked: number;
  today: string;
  leaves: string[];
}) {
  const { weekday, date } = dayParts(day.dateLocal);
  const isToday = day.dateLocal === today;
  const closed = day.window.closed;
  return (
    <div
      className={`cal-dayhead${isToday ? " is-today" : ""}${closed ? " is-closed" : ""}`}
      data-head-date={day.dateLocal}
    >
      <span>
        <span className="cal-dayhead-wd">{weekday}</span>
        {isToday ? <span className="cal-today-tag">Today</span> : null}
      </span>
      <span className="cal-dayhead-date">{date}</span>
      <span className="cal-pill">{closed && booked === 0 ? "Closed" : `${booked} booked`}</span>
      {leaves.map((name) => (
        <span key={name} className="cal-leave">
          {doctorShortName(name)} on leave
        </span>
      ))}
    </div>
  );
}
