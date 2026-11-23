import { addIstDays, istDate, istHour, istLongDate } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { icons } from "../../ui/icons";
import { Logo } from "../../ui/Logo";
import { shortName } from "../../ui/names";
import { StatCard } from "../../ui/StatCard";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import { useMe } from "../auth";
import { changeAppointmentStatus, listDayAppointments } from "./api";
import { buildTodayModel, type TodayModel } from "./buildTodayModel";
import { CallList } from "./CallList";
import { DoctorToday } from "./DoctorToday";
import { NextPatientCard } from "./NextPatientCard";
import { TodayList } from "./TodayList";
import { WalkInDialog } from "./WalkInDialog";
import "./today.css";
import "./today-cards.css";

function greeting(now: Date): string {
  const hour = istHour(now);
  if (hour < 12) return "Good morning";
  return hour < 17 ? "Good afternoon" : "Good evening";
}

// S01 (laptop) / S14 (phone). Real appointments API (2.4.3).
export function TodayScreen() {
  const me = useMe();
  const firstName = shortName(me.name);
  const isDoctor = me.role === "doctor";
  const [model, setModel] = useState<TodayModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [serverNow, setServerNow] = useState(() => new Date());

  const load = useCallback(() => {
    const dateLocal = istDate(new Date());
    listDayAppointments(dateLocal)
      .then((data) => {
        setServerNow(new Date(data.serverNow));
        setModel(buildTodayModel(data.appointments, data.window, data.serverNow));
        setError(null);
      })
      .catch((e) => {
        setModel(null);
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load today. Check the connection, then try again.",
        );
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useVisibleInterval(load, AUTO_REFRESH_MS);

  async function onStatus(
    id: string,
    status: Parameters<typeof changeAppointmentStatus>[1]["status"],
    version: number,
  ) {
    setBusyId(id);
    setError(null);
    try {
      await changeAppointmentStatus(id, { status, version });
      load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not update status. Check the connection, then try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="today">
      <header className="today-hero">
        <span className="hero-phone-only">
          <Logo />
        </span>
        <span className="hero-text">
          <h1>
            {greeting(serverNow)}, {firstName}
          </h1>
          <span className="hero-date">
            {istLongDate(serverNow)}.
            {model ? ` ${model.appointmentsCount} appointments today.` : ""}
          </span>
        </span>
        <button type="button" className="hero-search hero-phone-only" aria-label="Search patients">
          {icons.search}
        </button>
      </header>

      {error ? <p className="field-error">{error}</p> : null}

      {!isDoctor && model ? (
        <div className="today-stats">
          <StatCard
            label="Today's appointments"
            value={String(model.appointmentsCount)}
            note={`${model.openSlots} open slots`}
            good
          />
          <StatCard
            label="Arrived"
            value={String(model.arrivedCount)}
            note="checked in"
            good
            className="wide-only"
          />
          <StatCard
            label="Waiting"
            value={String(model.waitingCount)}
            note={
              model.longestWaitMin === null ? "none waiting" : `longest ${model.longestWaitMin} min`
            }
          />
          <StatCard
            label="Ready to bill"
            value={String(model.readyToBillCount)}
            note={model.readyToBillCount === 0 ? "nothing to collect" : "visit done, not paid"}
            good={model.readyToBillCount === 0}
            className={model.readyToBillCount > 0 ? "stat-ready" : ""}
          />
        </div>
      ) : null}

      {!isDoctor ? (
        <div className="today-toolbar">
          <button type="button" className="btn btn-primary" onClick={() => setWalkInOpen(true)}>
            Walk-in
          </button>
          <Link
            className="btn"
            to={`/app/print/day?date=${encodeURIComponent(istDate(serverNow))}`}
          >
            Print today's list
          </Link>
          <Link
            className="btn"
            to={`/app/print/day?date=${encodeURIComponent(addIstDays(istDate(serverNow), 1))}`}
          >
            Print tomorrow
          </Link>
        </div>
      ) : null}

      {!model && !error ? <p className="muted">Loading…</p> : null}

      {model && isDoctor ? <DoctorToday model={model} busyId={busyId} onStatus={onStatus} /> : null}

      {model && !isDoctor ? (
        <div className="today-body">
          <div className="today-next">
            <NextPatientCard
              patient={model.next}
              busy={busyId === model.next?.id}
              onSendIn={() => {
                if (!model.next) return;
                void onStatus(model.next.id, "in_chair", model.next.version);
              }}
            />
          </div>
          <div className="today-main">
            <TodayList rows={model.rows} busyId={busyId} onStatus={onStatus} onChanged={load} />
          </div>
          <div className="today-calls">
            <CallList items={model.callList} />
          </div>
        </div>
      ) : null}

      <WalkInDialog open={walkInOpen} onClose={() => setWalkInOpen(false)} onDone={load} />
    </div>
  );
}
