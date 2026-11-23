import { istHour, istLongDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { icons } from "../../ui/icons";
import { shortName } from "../../ui/names";
import { plural } from "../../ui/format";
import { useMe } from "../auth";
import { FollowUpList } from "./FollowUpList";
import { DoctorToday } from "./DoctorToday";
import { NextPatientCard } from "./NextPatientCard";
import { TodayActions } from "./TodayActions";
import { TodayList } from "./TodayList";
import { TodayStats } from "./TodayStats";
import { useTodayModel } from "./useTodayModel";
import { WalkInDialog } from "./WalkInDialog";
import "./today.css";
import "./today-cards.css";

function greeting(now: Date): string {
  const hour = istHour(now);
  if (hour < 12) return "Good morning";
  return hour < 17 ? "Good afternoon" : "Good evening";
}

// Main.dc.html / DoctorToday.dc.html (laptop) and PhoneToday.dc.html (phone). Q2.5.
export function TodayScreen() {
  const me = useMe();
  const isDoctor = me.role === "doctor";
  const { model, error, busyId, serverNow, load, onStatus } = useTodayModel();
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  // Q1.9: the top bar's Walk-in on another page lands here with ?walkin=1.
  useEffect(() => {
    if (params.get("walkin") !== "1") return;
    setWalkInOpen(true);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const who = isDoctor ? `Dr. ${shortName(me.name)}` : shortName(me.name);
  const subtitle = model
    ? isDoctor
      ? `${istLongDate(serverNow)} · ${plural(model.appointmentsCount, "patient")} today · ${model.doctorDoneCount} done`
      : `${istLongDate(serverNow)} · ${plural(model.appointmentsCount, "appointment")} today`
    : istLongDate(serverNow);

  return (
    <div className="today">
      <header className="today-hero">
        <span className="hero-text">
          <h1>
            {greeting(serverNow)}, {who}
          </h1>
          <span className="hero-date">{subtitle}</span>
        </span>
        <button type="button" className="hero-search hero-phone-only" aria-label="Search patients">
          {icons.search}
        </button>
        {!isDoctor ? (
          <div className="hero-actions">
            <TodayActions serverNow={serverNow} onWalkIn={() => setWalkInOpen(true)} />
          </div>
        ) : null}
      </header>

      {error ? <p className="field-error">{error}</p> : null}
      {!isDoctor && model ? <TodayStats model={model} /> : null}
      {!isDoctor ? (
        <div className="today-phone-actions">
          <TodayActions serverNow={serverNow} onWalkIn={() => setWalkInOpen(true)} />
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
            <FollowUpList items={model.callList} onChanged={load} />
          </div>
        </div>
      ) : null}

      <WalkInDialog open={walkInOpen} onClose={() => setWalkInOpen(false)} onDone={load} />
    </div>
  );
}
