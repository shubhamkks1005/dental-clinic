import { clashLanes, formatClockTime, type Doctor } from "@clinic/shared";
import type { MouseEvent } from "react";
import type { DayAppointment, DayAppointmentsReply } from "./api";
import { CalCard } from "./CalCard";
import { CalIcon } from "./CalIcon";
import {
  cardBox,
  cellState,
  firstStartInCell,
  gapsOf,
  hoursOf,
  minToPx,
  snapInHour,
  type GridSpan,
} from "./cal-geometry";
import { SlotPreview, type PreviewDraft } from "./SlotPreview";

const GONE = ["cancelled", "no_show", "rescheduled"];
const LANE_GAP = 6;

export type CellPick = { dateLocal: string; startMin: number; cell: HTMLElement };

type Props = {
  day: DayAppointmentsReply;
  rows: DayAppointment[];
  span: GridSpan;
  now: { date: string; min: number };
  index: number;
  sharedGapKeys: Set<string>;
  maxLanes: number;
  doctorsById: Map<string, Doctor> | null;
  activeHour: number | null;
  preview: PreviewDraft | null;
  selectedId: string | null;
  dockedId: string | null;
  onPick: (pick: CellPick) => void;
  onOpen: (row: DayAppointment, el: HTMLElement) => void;
  onMore: (dateLocal: string) => void;
};

/** Clashes are allowed (owner): a strip on the right of every column stays clickable, so a time
 * under a card can still be booked from the grid. */
const GUTTER = 14;

function laneStyle(lane: number, lanes: number, behind: boolean) {
  if (behind || lanes <= 1) return { left: 4, right: GUTTER };
  const w = `((100% - ${4 + GUTTER}px - ${LANE_GAP * (lanes - 1)}px) / ${lanes})`;
  return {
    left: `calc(4px + ${lane} * (${w} + ${LANE_GAP}px))`,
    width: `calc${w}`,
  };
}

// One day of the grid: hour cells you can click (15-minute start under the pointer), the
// bookings placed by minutes in clash lanes (P5.5.5), the now line and the live preview.
export function CalColumn(p: Props) {
  const { day, span, now } = p;
  const isToday = day.dateLocal === now.date;
  const places = clashLanes(
    p.rows.map((r) => ({
      id: r.id,
      startMin: r.startMin,
      endMin: r.endMin,
      busy: !GONE.includes(r.status),
    })),
  );
  const placeById = new Map(places.map((x) => [x.id, x]));
  const hidden = new Map<number, number>();
  const nowTop =
    isToday && !day.window.closed && now.min >= span.start && now.min <= span.end
      ? minToPx(now.min, span)
      : null;

  function pick(e: MouseEvent<HTMLButtonElement>, hour: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.detail === 0 ? 0 : e.clientY - rect.top;
    const wanted = snapInHour(hour, offset);
    p.onPick({
      dateLocal: day.dateLocal,
      startMin: firstStartInCell(day.window, hour, wanted, now),
      cell: e.currentTarget,
    });
  }

  return (
    <div
      className={`cal-col${isToday ? " is-today" : ""}`}
      data-col-date={day.dateLocal}
      data-col-index={p.index}
      style={{ gridColumn: p.index + 2, gridRow: 2 }}
    >
      {hoursOf(span).map((hour) => {
        const state = cellState(day.window, hour, now);
        return (
          <button
            key={hour}
            type="button"
            className={`cal-cell is-${state}${p.activeHour === hour ? " is-active" : ""}`}
            data-cell={`${day.dateLocal}|${hour}`}
            disabled={state !== "open"}
            tabIndex={state === "open" ? 0 : -1}
            aria-label={
              state === "open" ? `Book ${formatClockTime(hour)}, ${day.dateLocal}` : undefined
            }
            aria-hidden={state === "open" ? undefined : true}
            onClick={(e) => pick(e, hour)}
          >
            {state === "closed" ? "Closed" : null}
          </button>
        );
      })}
      {gapsOf(day.window)
        .filter((g) => !p.sharedGapKeys.has(`${g[0]}-${g[1]}`))
        .map((g) => (
          <div
            key={g[0]}
            className="cal-lunch"
            style={{
              top: minToPx(g[0], span),
              height: minToPx(g[1], span) - minToPx(g[0], span),
              left: 0,
              right: 0,
            }}
          >
            <span
              className="cal-lunch-pill"
              title={`Lunch ${formatClockTime(g[0])} – ${formatClockTime(g[1])}`}
            >
              <CalIcon name="coffee" />
              Lunch
            </span>
          </div>
        ))}
      {p.rows.map((row) => {
        const place = placeById.get(row.id);
        if (!place) return null;
        const lanes = Math.min(place.lanes, p.maxLanes);
        if (!place.behind && place.lane >= p.maxLanes) {
          const hourKey = Math.floor(row.startMin / 60) * 60;
          hidden.set(hourKey, (hidden.get(hourKey) ?? 0) + 1);
          return null;
        }
        const box = cardBox(row.startMin, row.endMin, span);
        return (
          <CalCard
            key={row.id}
            row={row}
            height={box.height}
            style={{
              top: box.top,
              height: box.height,
              ...laneStyle(place.lane, lanes, place.behind),
            }}
            doctor={
              row.doctorId && p.doctorsById ? (p.doctorsById.get(row.doctorId) ?? null) : null
            }
            narrow={lanes > 1 && !place.behind}
            selected={p.selectedId === row.id}
            docked={p.dockedId === row.id}
            onOpen={p.onOpen}
          />
        );
      })}
      {[...hidden].map(([hourKey, n]) => (
        <button
          key={`more-${hourKey}`}
          type="button"
          className="cal-more"
          style={{ top: minToPx(hourKey, span) + 2, right: GUTTER }}
          onClick={() => p.onMore(day.dateLocal)}
        >
          +{n} more
        </button>
      ))}
      {nowTop !== null ? (
        <div
          className="cal-now"
          style={{ top: nowTop }}
          aria-label={`Now ${formatClockTime(now.min)}`}
        >
          <span className="cal-now-dot" />
          <span className="cal-now-label">NOW {formatClockTime(now.min)}</span>
        </div>
      ) : null}
      {p.preview && p.preview.dateLocal === day.dateLocal ? (
        <SlotPreview draft={p.preview} top={minToPx(p.preview.startMin, span) + 4} />
      ) : null}
    </div>
  );
}
