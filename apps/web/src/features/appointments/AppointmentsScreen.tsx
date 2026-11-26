import { addIstDays, istDate, istMinutes, type AppointmentSearchHit } from "@clinic/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOnline } from "../../ui/use-online";
import { useWide } from "../../ui/use-wide";
import { useMe } from "../auth";
import type { DayAppointment, DayAppointmentsReply } from "./api";
import { BookPopover } from "./book/BookPopover";
import { sideForColumn } from "./book/place-popover";
import { loadVisitTypes, type BookRequest } from "./book/useBookDraft";
import type { Anchor } from "./book/usePopoverPlace";
import { CalendarBody } from "./CalendarBody";
import type { CellPick } from "./CalColumn";
import { CalHeader } from "./CalHeader";
import { CalSearch } from "./CalSearch";
import { DoctorFilter } from "./DoctorFilter";
import { nextOpenStart } from "./cal-geometry";
import type { PreviewDraft } from "./SlotPreview";
import { useCalendarData } from "./useCalendarData";
import { useCalendarUrl } from "./useCalendarUrl";
import { weekDays } from "./useWeek";
import "../../styles/design-fonts.css";
import "./cal-tokens.css";
import "./cal-page.css";
import "./cal-filter.css";
import "./cal-search.css";
import "./cal-grid.css";
import "./cal-card.css";
import "./phone-day.css";

const GONE = ["cancelled", "no_show", "rescheduled"];
const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

// Appointments calendar (docs/design/final/appointments_calendar.html; handoff P4-P7).
export function AppointmentsScreen() {
  const me = useMe();
  const url = useCalendarUrl();
  const online = useOnline();
  const doctorView = me.role === "doctor";
  const laptop = useWide(1024);
  const tablet = useWide(768);
  const week = laptop && url.view !== "day";
  const shown = useMemo(() => (week ? weekDays(url.date) : [url.date]), [week, url.date]);
  const data = useCalendarData(shown[0]!, shown[shown.length - 1]!);
  const [req, setReq] = useState<{ key: number; r: BookRequest } | null>(null);
  const [preview, setPreview] = useState<PreviewDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dockedId, setDockedId] = useState<string | null>(null);
  const [openAfterLoad, setOpenAfterLoad] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const keySeq = useRef(0);

  useEffect(() => {
    // The popover's chips are ready before the first click (no late growth).
    loadVisitTypes().catch(() => undefined);
    document.body.classList.add("cal-body");
    return () => document.body.classList.remove("cal-body");
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // "Now" from the server's clock plus the time since the reply (P5.6.1).
  const serverNow = data.days?.[0]?.serverNow;
  const skew = useMemo(() => (serverNow ? Date.parse(serverNow) - Date.now() : 0), [serverNow]);
  const nowDate = new Date(clock + skew);
  const now = { date: istDate(nowDate), min: istMinutes(nowDate) };

  const allIds = data.doctors.map((d) => d.id);
  const chosen = useMemo(() => new Set(url.doctors ?? allIds), [url.doctors, allIds.join(",")]);
  const doctorsById = useMemo(() => new Map(data.doctors.map((d) => [d.id, d])), [data.doctors]);
  const rowsOf = useCallback(
    (d: DayAppointmentsReply) =>
      doctorView
        ? d.appointments
        : d.appointments.filter((a) => !a.doctorId || chosen.has(a.doctorId)),
    [doctorView, chosen],
  );
  const leavesOf = useCallback(
    (d: DayAppointmentsReply) =>
      (d.leaves ?? []).filter((l) => doctorView || chosen.has(l.doctorId)).map((l) => l.doctorName),
    [doctorView, chosen],
  );
  const booked = data.days
    ? data.days.reduce((n, d) => n + rowsOf(d).filter((a) => !GONE.includes(a.status)).length, 0)
    : null;
  const onlyDoctor = !doctorView && chosen.size === 1 ? [...chosen][0] : undefined;

  function open(r: Omit<BookRequest, "mode">) {
    if (!online) return;
    keySeq.current += 1;
    setReq({ key: keySeq.current, r: { mode: "book", doctorId: onlyDoctor, ...r } });
  }

  // Links from other pages (?book=1&patient=..., ?book=<minute>).
  const book = url.book;
  useEffect(() => {
    if (!book || req) return;
    open({
      anchor: null,
      side: "auto",
      dateLocal: url.date,
      startMin: book.startMin ?? Math.ceil(istMinutes(new Date()) / 15) * 15,
      patientId: book.patientId,
    });
    // Opens once per link; the popover's close clears the link.
  }, [book?.patientId, book?.startMin]);

  function onPick(pick: CellPick) {
    setSelectedId(null);
    const cols = shown.length;
    const index = shown.indexOf(pick.dateLocal);
    open({
      anchor: pick.cell,
      side: sideForColumn(index, cols),
      dateLocal: pick.dateLocal,
      startMin: pick.startMin,
    });
  }

  function onHeaderBook() {
    const next = data.days
      ? nextOpenStart(
          data.days.map((d) => d.window),
          now,
        )
      : null;
    open({
      anchor: null,
      side: "auto",
      dateLocal: next?.dateLocal ?? url.date,
      startMin: next?.startMin ?? 9 * 60,
    });
  }

  const onRetarget = useCallback(
    (dateLocal: string, startMin: number): Anchor | null => {
      const el = document.querySelector<HTMLElement>(
        `[data-cell="${dateLocal}|${Math.floor(startMin / 60) * 60}"]`,
      );
      if (!el || !laptop) return null;
      return { el, side: sideForColumn(shown.indexOf(dateLocal), shown.length) };
    },
    [shown, laptop],
  );

  async function onBooked(row: DayAppointment): Promise<HTMLElement | null> {
    if (!shown.includes(row.dateLocal) || !data.days) {
      url.setDate(row.dateLocal);
      return null;
    }
    data.insertRow(row);
    setDockedId(row.id);
    window.setTimeout(() => setDockedId(null), 700);
    await nextFrame();
    return document.querySelector<HTMLElement>(`.cal-card[data-row-id="${row.id}"]`);
  }

  function onJump(hit: AppointmentSearchHit) {
    url.setDate(hit.dateLocal);
    setOpenAfterLoad(hit.id);
  }
  useEffect(() => {
    if (!openAfterLoad || !data.days) return;
    if (data.days.some((d) => d.appointments.some((a) => a.id === openAfterLoad))) {
      setSelectedId(openAfterLoad);
      setOpenAfterLoad(null);
    }
  }, [openAfterLoad, data.days]);

  const printDay = shown.includes(url.today) ? url.today : shown[0]!;
  const active = preview
    ? { dateLocal: preview.dateLocal, hour: Math.floor(preview.startMin / 60) * 60 }
    : null;

  return (
    <div className="cal-scope cal-page">
      <CalHeader
        week={week}
        first={shown[0]!}
        last={shown[shown.length - 1]!}
        booked={booked}
        doctorView={doctorView}
        date={url.date}
        canToggle={laptop}
        printHref={`/app/print/day?date=${printDay}`}
        search={
          tablet ? (
            <CalSearch
              doctorIds={doctorView ? [] : [...chosen]}
              showDoctor={!doctorView}
              onJump={onJump}
            />
          ) : null
        }
        filter={
          doctorView ? null : (
            <DoctorFilter
              doctors={data.doctors}
              chosen={chosen}
              onChange={(next) => url.setDoctors(next.size === allIds.length ? null : [...next])}
            />
          )
        }
        onStep={(dir) => url.setDate(addIstDays(url.date, dir * (week ? 7 : 1)))}
        onToday={() => url.setDate(url.today)}
        onDate={url.setDate}
        onView={(v) => url.setView(v)}
        onBook={onHeaderBook}
        bookDisabled={!online}
      />
      <CalendarBody
        data={data}
        shown={shown}
        week={week}
        laptop={laptop}
        tablet={tablet}
        now={now}
        rowsOf={rowsOf}
        leavesOf={leavesOf}
        doctorsById={doctorView ? null : doctorsById}
        noDoctor={!doctorView && chosen.size === 0 && data.doctors.length > 0}
        empty={booked === 0}
        active={req ? active : null}
        preview={req ? preview : null}
        selectedId={selectedId}
        dockedId={dockedId}
        onSelect={setSelectedId}
        onPick={onPick}
        onMore={(d) => url.setView("day", d)}
        onDate={url.setDate}
        onShowAll={() => url.setDoctors(null)}
        onBook={onHeaderBook}
      />
      {req ? (
        <BookPopover
          key={req.key}
          request={req.r}
          doctors={data.doctors}
          onDraft={setPreview}
          onRetarget={onRetarget}
          onBooked={onBooked}
          onReload={data.reload}
          onClose={() => {
            setReq(null);
            setPreview(null);
            if (url.book) url.clearBook();
          }}
        />
      ) : null}
    </div>
  );
}
