import type { Doctor } from "@clinic/shared";
import type { DayAppointment, DayAppointmentsReply } from "./api";
import { CalGrid } from "./CalGrid";
import type { CellPick } from "./CalColumn";
import { DateStrip } from "./DateStrip";
import { DayDetails } from "./DayDetails";
import { PhoneDayList } from "./PhoneDayList";
import type { PreviewDraft } from "./SlotPreview";
import type { CalendarData } from "./useCalendarData";
import { weekDays } from "./useWeek";

type Props = {
  data: CalendarData;
  shown: string[];
  week: boolean;
  laptop: boolean;
  tablet: boolean;
  now: { date: string; min: number };
  rowsOf: (d: DayAppointmentsReply) => DayAppointment[];
  leavesOf: (d: DayAppointmentsReply) => string[];
  doctorsById: Map<string, Doctor> | null;
  noDoctor: boolean;
  empty: boolean;
  active: { dateLocal: string; hour: number } | null;
  preview: PreviewDraft | null;
  selectedId: string | null;
  dockedId: string | null;
  onSelect: (id: string | null) => void;
  onPick: (pick: CellPick) => void;
  onMore: (dateLocal: string) => void;
  onDate: (dateLocal: string) => void;
  onShowAll: () => void;
  onBook: () => void;
};

/** P7.2.1: the grid's shape while the first list loads. */
function Skeleton() {
  return (
    <div className="cal-week" aria-busy="true" aria-label="Loading the calendar">
      <div className="cal-grid-empty">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display: "flex", gap: 16, margin: "18px 0" }}>
            <span className="cal-skel" style={{ width: 64 }} />
            <span className="cal-skel" style={{ flex: 1 }} />
            <span className="cal-skel" style={{ flex: 1 }} />
            <span className="cal-skel" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// The calendar area under the header: states (P7.2), the grid (laptop week or day, tablet day),
// the phone list (parked, Q6) and the details panel (P5.9).
export function CalendarBody(p: Props) {
  const { data } = p;
  const days = data.days;
  const all = days ? days.flatMap((d) => d.appointments) : [];
  const selected = all.find((a) => a.id === p.selectedId) ?? null;
  const doctor =
    selected?.doctorId && p.doctorsById ? (p.doctorsById.get(selected.doctorId) ?? null) : null;
  const details = (
    <DayDetails
      row={selected}
      doctor={doctor}
      onClose={() => p.onSelect(null)}
      onChanged={data.reload}
    />
  );

  return (
    <main className="cal-main">
      {!p.tablet ? (
        <DateStrip
          days={p.shown.length === 1 ? weekDays(p.shown[0]!) : p.shown}
          selected={p.shown[0]!}
          onPick={p.onDate}
          label="Day"
        />
      ) : null}
      {data.refreshError ? (
        <p className="cal-alert" role="status">
          {data.refreshError}
          <button type="button" className="cal-link" onClick={data.reload}>
            Retry
          </button>
        </p>
      ) : null}
      {p.noDoctor ? (
        <p className="cal-note">
          No doctor chosen.{" "}
          <button type="button" className="cal-link" onClick={p.onShowAll}>
            Show all
          </button>
        </p>
      ) : p.empty ? (
        <p className="cal-note">
          No appointments {p.week ? "this week" : "on this day"}.{" "}
          <button type="button" className="cal-link" onClick={p.onBook}>
            Book
          </button>
        </p>
      ) : null}
      {data.loadError ? (
        <p className="cal-alert" role="alert">
          {data.loadError}
          <button type="button" className="cal-btn" onClick={data.reload}>
            Retry
          </button>
        </p>
      ) : !days ? (
        <Skeleton />
      ) : p.tablet ? (
        <div className={`cal-layout${selected ? " has-details" : ""}`}>
          <section className="cal-week" aria-label={p.week ? "Week calendar" : "Day calendar"}>
            <CalGrid
              days={days}
              rowsOf={p.rowsOf}
              leavesOf={p.leavesOf}
              week={p.week}
              now={p.now}
              doctorsById={p.doctorsById}
              active={p.active}
              preview={p.preview}
              selectedId={p.selectedId}
              dockedId={p.dockedId}
              onPick={p.onPick}
              onOpen={(row) => p.onSelect(p.selectedId === row.id ? null : row.id)}
              onMore={p.onMore}
            />
          </section>
          {selected ? (
            p.laptop ? (
              details
            ) : (
              <div className="day-details-sheet">{details}</div>
            )
          ) : null}
        </div>
      ) : (
        days[0] && (
          <PhoneDayList
            window={days[0].window}
            appointments={p.rowsOf(days[0])}
            doctorsById={p.doctorsById}
            onChanged={data.reload}
          />
        )
      )}
    </main>
  );
}
