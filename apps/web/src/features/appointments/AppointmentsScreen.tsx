import { addIstDays, istDate } from "@clinic/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import { listDayAppointments, type DayAppointmentsReply } from "./api";
import { DayView } from "./DayView";
import { QuickBookDialog } from "./QuickBookDialog";
import "./day-view.css";

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
  const today = istDate(new Date());
  const dateLocal = validDate(params.get("date")) ?? today;
  const bookMin = parseBookMin(params.get("book"));
  const patientId = params.get("patient") || undefined;
  const wantBook = bookMin !== undefined || Boolean(patientId) || params.get("book") === "1";

  const [data, setData] = useState<DayAppointmentsReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(wantBook);

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

  useEffect(() => {
    if (wantBook) setBookOpen(true);
  }, [wantBook]);

  function setDate(next: string) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("date", next);
    setParams(nextParams, { replace: true });
  }

  function clearBookParams() {
    const next = new URLSearchParams(params);
    next.delete("book");
    next.delete("patient");
    setParams(next, { replace: true });
  }

  return (
    <div className="appointments-page">
      <header className="appointments-head">
        <h1>Appointments</h1>
        <div className="appointments-date-nav">
          <button
            type="button"
            className="btn"
            aria-label="Previous day"
            onClick={() => setDate(addIstDays(dateLocal, -1))}
          >
            Previous
          </button>
          <label className="appointments-date">
            <span className="sr-only">Date</span>
            <input
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
            aria-label="Next day"
            onClick={() => setDate(addIstDays(dateLocal, 1))}
          >
            Next
          </button>
          <button type="button" className="btn" onClick={() => setDate(today)}>
            Today
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("book", "1");
              setParams(next, { replace: true });
              setBookOpen(true);
            }}
          >
            Book
          </button>
        </div>
      </header>

      {error ? <p className="field-error">{error}</p> : null}
      {!data && !error ? <p className="muted">Loading…</p> : null}
      {data ? (
        <DayView
          dateLocal={data.dateLocal}
          window={data.window}
          appointments={data.appointments}
          serverNow={data.serverNow}
          onEmptySlot={(startMin) => {
            const next = new URLSearchParams(params);
            next.set("date", dateLocal);
            next.set("book", String(startMin));
            setParams(next, { replace: true });
            setBookOpen(true);
          }}
          onChanged={load}
        />
      ) : null}

      <QuickBookDialog
        open={bookOpen}
        prefill={prefill}
        onClose={() => {
          setBookOpen(false);
          clearBookParams();
        }}
        onBooked={load}
      />
    </div>
  );
}
