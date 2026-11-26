import { formatClockTime, type Doctor } from "@clinic/shared";
import type { KeyboardEvent } from "react";
import type { DayAppointment, DayAppointmentsReply } from "./api";
import { CalColumn, type CellPick } from "./CalColumn";
import { CalDayHead } from "./CalDayHead";
import { CalIcon } from "./CalIcon";
import { gridSpan, hourLabel, hoursOf, minToPx, sharedGaps } from "./cal-geometry";
import type { PreviewDraft } from "./SlotPreview";

type Props = {
  days: DayAppointmentsReply[];
  rowsOf: (day: DayAppointmentsReply) => DayAppointment[];
  leavesOf: (day: DayAppointmentsReply) => string[];
  week: boolean;
  now: { date: string; min: number };
  doctorsById: Map<string, Doctor> | null;
  active: { dateLocal: string; hour: number } | null;
  preview: PreviewDraft | null;
  selectedId: string | null;
  dockedId: string | null;
  onPick: (pick: CellPick) => void;
  onOpen: (row: DayAppointment, el: HTMLElement) => void;
  onMore: (dateLocal: string) => void;
};

/** Arrow keys move between bookable cells (P7.3.2): up/down an hour, left/right a day. */
function moveFocus(e: KeyboardEvent<HTMLDivElement>) {
  const el = e.target as HTMLElement;
  const key = el.dataset.cell;
  if (!key) return;
  const [date, hourRaw] = key.split("|") as [string, string];
  const hour = Number(hourRaw);
  const cols = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-col-date]")].map(
    (c) => c.dataset.colDate!,
  );
  let next: string | null = null;
  if (e.key === "ArrowDown") next = `${date}|${hour + 60}`;
  if (e.key === "ArrowUp") next = `${date}|${hour - 60}`;
  const i = cols.indexOf(date);
  if (e.key === "ArrowRight" && cols[i + 1]) next = `${cols[i + 1]}|${hour}`;
  if (e.key === "ArrowLeft" && i > 0) next = `${cols[i - 1]}|${hour}`;
  if (!next) return;
  e.preventDefault();
  e.currentTarget.querySelector<HTMLElement>(`[data-cell="${next}"]:not(:disabled)`)?.focus();
}

// The week (7 columns) or day (1 column) grid: heads, time column, columns, shared lunch band.
export function CalGrid(p: Props) {
  const allRows = p.days.flatMap((d) => p.rowsOf(d));
  const span = gridSpan(
    p.days.map((d) => d.window),
    allRows,
  );
  const shared = sharedGaps(p.days.map((d) => d.window));
  const sharedKeys = new Set(shared.map((g) => `${g[0]}-${g[1]}`));
  const hours = hoursOf(span);
  return (
    <div className="cal-grid-scroll cal-scroll" data-testid="cal-grid">
      <div
        className={`cal-grid${p.week ? " is-week" : ""}`}
        style={{ ["--cal-cols" as string]: p.days.length }}
        onKeyDown={moveFocus}
      >
        <div className="cal-timehead">Time (IST)</div>
        {p.days.map((d) => (
          <CalDayHead
            key={d.dateLocal}
            day={d}
            booked={
              p.rowsOf(d).filter((r) => !["cancelled", "no_show", "rescheduled"].includes(r.status))
                .length
            }
            today={p.now.date}
            leaves={p.leavesOf(d)}
          />
        ))}
        <div className="cal-hours" aria-hidden="true" style={{ gridColumn: 1, gridRow: 2 }}>
          {hours.map((m) => (
            <span key={m} className="cal-hour-label">
              {hourLabel(m)}
            </span>
          ))}
        </div>
        {p.days.map((d, i) => (
          <CalColumn
            key={d.dateLocal}
            day={d}
            rows={p.rowsOf(d)}
            span={span}
            now={p.now}
            index={i}
            sharedGapKeys={sharedKeys}
            maxLanes={p.week ? 2 : 6}
            doctorsById={p.doctorsById}
            activeHour={p.active?.dateLocal === d.dateLocal ? p.active.hour : null}
            preview={p.preview}
            selectedId={p.selectedId}
            dockedId={p.dockedId}
            onPick={p.onPick}
            onOpen={p.onOpen}
            onMore={p.onMore}
          />
        ))}
        {shared.map((g) => (
          <div
            key={g[0]}
            style={{
              gridColumn: "2 / -1",
              gridRow: 2,
              position: "relative",
              pointerEvents: "none",
            }}
          >
            <div
              className="cal-lunch"
              style={{
                top: minToPx(g[0], span),
                height: minToPx(g[1], span) - minToPx(g[0], span),
                left: 0,
                right: 0,
              }}
            >
              <span className="cal-lunch-pill">
                <CalIcon name="coffee" />
                Clinic Lunch Break ({formatClockTime(g[0])} – {formatClockTime(g[1])})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
