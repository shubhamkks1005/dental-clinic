import { addIstDays, istDate } from "@clinic/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import { useToast } from "../../ui/Toast";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import { listDayAppointments, type DayAppointmentsReply, type SuggestedSlot } from "./api";
import { bookedMessage } from "./booked-message";
import { DateStrip } from "./DateStrip";
import { DayView } from "./DayView";
import { PhoneDayList } from "./PhoneDayList";
import { QuickBookDialog } from "./QuickBookDialog";
import { useWeek, weekDays } from "./useWeek";
import { WeekView, weekBooked } from "./WeekView";
import { formatDate, plural } from "@clinic/shared";
import { useWide } from "../../ui/use-wide";
import "./day-view.css";
import "./week-view.css";
import { TextInput } from "../../ui/form";

function validDate(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parseBookMin(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < 1440 ? n : undefined;
}

// S08 Appointments — day view (2.4.1) + quick-book (2.4.2 / S07).
export function AppointmentsScreen() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const today = istDate(new Date());
  const dateLocal = validDate(params.get("date")) ?? today;
  const bookMin = parseBookMin(params.get("book"));
  const patientId = params.get("patient") || undefined;
  const wantBook = bookMin !== undefined || Boolean(patientId) || params.get("book") === "1";

  const [data, setData] = useState<DayAppointmentsReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(wantBook);
  const [tick, setTick] = useState(0);
  const laptop = useWide(1024);
  const tablet = useWide(768);
  // Week grid needs room: laptop only. Phone and tablet use the day.
  const week = laptop && params.get("view") !== "day";
  const weekData = useWeek(week, dateLocal, tick);

  const prefill = useMemo(
    () => ({ dateLocal, startMin: bookMin, patientId }),
    [dateLocal, bookMin, patientId],
  );

  const load = useCallback(() => {
    setError(null);
    listDayAppointments(dateLocal)
      .then(setData)
      .catch((e) => {
        setData(null);
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load the day. Check the connection, then try again.",
        );
      });
  }, [dateLocal]);

  useEffect(() => {
    load();
  }, [load]);

  useVisibleInterval(load, AUTO_REFRESH_MS);
  useVisibleInterval(() => setTick((t) => t + 1), AUTO_REFRESH_MS);

  useEffect(() => {
    if (wantBook) setBookOpen(true);
  }, [wantBook]);

  // Functional updates: the book dialog sets the date and then closes in the same tick, and the
  // close must not bring back the old date.
  function setDate(next: string) {
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.set("date", next);
        return nextParams;
      },
      { replace: true },
    );
  }

  function clearBookParams() {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("book");
        next.delete("patient");
        return next;
      },
      { replace: true },
    );
  }

  function onBooked(slot: SuggestedSlot) {
    // The booking may be on another day: go there so it is on screen, and say where it went.
    if (slot.dateLocal === dateLocal) {
      load();
      setTick((t) => t + 1);
    } else setDate(slot.dateLocal);
    toast({ text: bookedMessage(slot.dateLocal, slot.startMin) });
  }

  const changed = () => {
    load();
    setTick((t) => t + 1);
  };
  const step = week ? 7 : 1;
  const unit = week ? "week" : "day";
  const days = weekDays(dateLocal);
  const booked = week && weekData.days ? weekBooked(weekData.days) : null;
  const dayLive = data?.appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show" && a.status !== "rescheduled",
  );
  const title = week
    ? `${formatDate(days[0] as string)} to ${formatDate(days[5] as string)}`
    : formatDate(dateLocal);
  const summary = week
    ? booked !== null && `${plural(booked, "appointment")} this week`
    : data && !data.window.closed && `${dayLive?.length ?? 0} booked`;
  function openBook(startMin?: number) {
    const next = new URLSearchParams(params);
    next.set("date", dateLocal);
    next.set("book", startMin === undefined ? "1" : String(startMin));
    setParams(next, { replace: true });
    setBookOpen(true);
  }
  function setView(view: "day" | "week") {
    const next = new URLSearchParams(params);
    next.set("view", view);
    setParams(next, { replace: true });
  }

  return (
    <div className="appointments-page">
      <header className="appointments-head">
        <div>
          <h1>Appointments</h1>
          <p className="muted small">
            <strong>{title}</strong>
            {summary ? ` · ${summary}` : ""}
          </p>
        </div>
        <div className="appointments-date-nav">
          {laptop ? (
            <div className="view-toggle" role="group" aria-label="View">
              <button type="button" aria-pressed={!week} onClick={() => setView("day")}>
                Day
              </button>
              <button type="button" aria-pressed={week} onClick={() => setView("week")}>
                Week
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="btn"
            aria-label={`Previous ${unit}`}
            onClick={() => setDate(addIstDays(dateLocal, -step))}
          >
            Previous
          </button>
          <label className="appointments-date">
            <span className="sr-only">Date</span>
            <TextInput
              type="date"
              value={dateLocal}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
          <button
            type="button"
            className="btn"
            aria-label={`Next ${unit}`}
            onClick={() => setDate(addIstDays(dateLocal, step))}
          >
            Next
          </button>
          <button type="button" className="btn" onClick={() => setDate(today)}>
            Today
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openBook()}>
            Book appointment
          </button>
        </div>
      </header>

      {!tablet ? <DateStrip days={days} selected={dateLocal} onPick={setDate} label="Day" /> : null}
      {error || weekData.error ? (
        <p className="field-error">{week ? weekData.error : error}</p>
      ) : null}
      {week ? (
        weekData.days ? (
          <WeekView
            days={weekData.days}
            today={today}
            onOpenDay={(d) => {
              const next = new URLSearchParams(params);
              next.set("date", d);
              next.set("view", "day");
              setParams(next, { replace: true });
            }}
            onChanged={changed}
          />
        ) : weekData.error ? null : (
          <p className="muted">Loading…</p>
        )
      ) : !data && !error ? (
        <p className="muted">Loading…</p>
      ) : data && tablet ? (
        <DayView
          dateLocal={data.dateLocal}
          window={data.window}
          appointments={data.appointments}
          serverNow={data.serverNow}
          onEmptySlot={openBook}
          onChanged={changed}
        />
      ) : data ? (
        <PhoneDayList window={data.window} appointments={data.appointments} onChanged={changed} />
      ) : null}

      <QuickBookDialog
        open={bookOpen}
        prefill={prefill}
        onClose={() => {
          setBookOpen(false);
          clearBookParams();
        }}
        onBooked={onBooked}
      />
    </div>
  );
}
