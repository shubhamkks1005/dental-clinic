import { formatRupees, istHour, istLongDate } from "@clinic/shared";
import { icons } from "../../ui/icons";
import { Logo } from "../../ui/Logo";
import { sampleUser } from "../../ui/shell/sample-session";
import { StatCard } from "../../ui/StatCard";
import { CallList } from "./CallList";
import { NextPatientCard } from "./NextPatientCard";
import { sampleCallList, sampleNextPatient, sampleRows, sampleStats as s } from "./sample-data";
import { TodayList } from "./TodayList";
import "./today.css";
import "./today-cards.css";

function greeting(now: Date): string {
  const hour = istHour(now);
  if (hour < 12) return "Good morning";
  return hour < 17 ? "Good afternoon" : "Good evening";
}

// S01 (laptop) and S14 (phone), with fake sample data until the appointments API exists.
export function TodayScreen() {
  const now = new Date();
  return (
    <div className="today">
      <header className="today-hero">
        <span className="hero-phone-only">
          <Logo />
        </span>
        <span className="hero-text">
          <h1>
            {greeting(now)}, {sampleUser.name.split(" ")[0]}
          </h1>
          <span className="hero-date">
            {istLongDate(now)}. {s.appointments} appointments today.
          </span>
        </span>
        <button type="button" className="hero-search hero-phone-only" aria-label="Search patients">
          {icons.search}
        </button>
      </header>

      <div className="today-stats">
        <StatCard
          label="Today's appointments"
          value={String(s.appointments)}
          note={`${s.openSlots} open slots`}
          good
        />
        <StatCard
          label="Arrived"
          value={String(s.arrived)}
          note="on time"
          good
          className="wide-only"
        />
        <StatCard
          label="Waiting"
          value={String(s.waiting)}
          note={`longest ${s.longestWaitMin} min`}
        />
        <StatCard
          label="Today's collection"
          value={formatRupees(s.collectionPaise)}
          note={`${s.bills} bills`}
          className="wide-only"
        />
      </div>

      <div className="today-body">
        <div className="today-next">
          <NextPatientCard patient={sampleNextPatient} />
        </div>
        <div className="today-main">
          <TodayList rows={sampleRows} />
        </div>
        <div className="today-calls">
          <CallList items={sampleCallList} />
        </div>
      </div>
    </div>
  );
}
